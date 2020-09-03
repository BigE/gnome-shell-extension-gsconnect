'use strict';

const {Gio, GLib} = imports.gi;

const Mock = imports.fixtures.utils;

const Core = imports.service.core;
const Device = imports.service.device;
const Lan = imports.service.backends.lan;


describe('A LAN channel service', function () {
    let local, remote;
    let localChannel, remoteChannel;

    beforeAll(function () {
        const localCert = Gio.TlsCertificate.new_from_files(
            Mock.getDataPath('local-certificate.pem'),
            Mock.getDataPath('local-private.pem')
        );

        local = new Lan.ChannelService({
            id: GLib.uuid_string_random(),
            certificate: localCert,
            port: 1717,
        });

        const remoteCert = Gio.TlsCertificate.new_from_files(
            Mock.getDataPath('remote-certificate.pem'),
            Mock.getDataPath('remote-private.pem')
        );

        remote = new Lan.ChannelService({
            id: GLib.uuid_string_random(),
            certificate: remoteCert,
            port: 1718,
        });
    });

    afterAll(function () {
        local.destroy();
        remote.destroy();
    });

    it('can be started', function () {
        local.start();
        expect(local.active).toBe(true);

        remote.start();
        expect(remote.active).toBe(true);
    });

    it('can broadcast and open channels from broadcasts', function (done) {
        const localId = local.connect('channel', (service, channel) => {
            local.disconnect(localId);
            localChannel = channel;

            if (localChannel && remoteChannel)
                done();

            return true;
        });

        const remoteId = remote.connect('channel', (service, channel) => {
            remote.disconnect(remoteId);
            remoteChannel = channel;

            if (localChannel && remoteChannel)
                done();

            return true;
        });

        local.broadcast('127.0.0.1:1718');
    });

    it('tracks active channels', function () {
        // NOTE: the broadcasting side uses it's own port for reconnect
        localChannel = local.channels.get(`lan://127.0.0.1:${local.port}`);
        expect(localChannel).toBeDefined();

        remoteChannel = remote.channels.get(`lan://127.0.0.1:${local.port}`);
        expect(remoteChannel).toBeDefined();
    });

    it('produces channels that can send/receive packets', async function () {
        let outgoingPacket = new Core.Packet({
            type: 'kdeconnect.test',
            body: {
                foo: GLib.uuid_string_random(),
            },
        });
        await localChannel.sendPacket(outgoingPacket);

        let incomingPacket = await remoteChannel.readPacket();
        expect(incomingPacket.id).toBe(outgoingPacket.id);
        expect(incomingPacket.type).toBe(outgoingPacket.type);
        expect(incomingPacket.body.foo).toBe(outgoingPacket.body.foo);
    });

    it('produces channels that can transfer payloads', async function () {
        // Uploading Channel
        const outgoingPacket = new Core.Packet({
            type: 'kdeconnect.test',
            body: {foo: 'bar'},
        });
        const localBytes = new GLib.Bytes(GLib.uuid_string_random());
        const inputStream = Gio.MemoryInputStream.new_from_bytes(localBytes);
        const localTransfer = new Core.Transfer({channel: localChannel});

        localTransfer.addStream(outgoingPacket, inputStream,
            localBytes.get_size());
        localTransfer.start().catch(e => logError(e));

        // Downloading Channel
        const incomingPacket = await remoteChannel.readPacket();
        const outputStream = Gio.MemoryOutputStream.new_resizable();
        const remoteTransfer = new Core.Transfer({channel: remoteChannel});

        remoteTransfer.addStream(incomingPacket, outputStream);
        await remoteTransfer.start();
        const remoteBytes = outputStream.steal_as_bytes();

        expect(localBytes.equal(remoteBytes)).toBe(true);
    });

    it('can be stopped', function () {
        local.stop();
        expect(local.active).toBe(false);

        remote.stop();
        expect(remote.active).toBe(false);
    });

    it('closes active channels when stopped', function () {
        expect(local.channels.size).toBe(0);
        localChannel = null;

        expect(remote.channels.size).toBe(0);
        remoteChannel = null;
    });

    // TODO: restarting stopped services
});

