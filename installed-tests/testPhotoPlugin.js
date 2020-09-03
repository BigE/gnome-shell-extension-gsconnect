'use strict';

const {Gio, GLib} = imports.gi;

const Mock = imports.fixtures.utils;


describe('The photo plugin', function () {
    let testRig;
    let localPlugin, remotePlugin;

    beforeAll(async function () {
        testRig = new Mock.TestRig();
        await testRig.prepare({
            localDevice: {
                incomingCapabilities: [
                    'kdeconnect.photo',
                    'kdeconnect.photo.request',
                ],
                outgoingCapabilities: [
                    'kdeconnect.photo',
                    'kdeconnect.photo.request',
                ],
            },
            remoteDevice: {
                incomingCapabilities: [
                    'kdeconnect.photo',
                    'kdeconnect.photo.request',
                ],
                outgoingCapabilities: [
                    'kdeconnect.photo',
                    'kdeconnect.photo.request',
                ],
            },
        });
        testRig.setPaired(true);
    });

    afterAll(function () {
        testRig.destroy();
    });

    beforeEach(function () {
        if (localPlugin && remotePlugin) {
            spyOn(localPlugin, 'handlePacket').and.callThrough();
            spyOn(remotePlugin, 'handlePacket').and.callThrough();
        }
    });

    it('can be loaded', async function () {
        await testRig.loadPlugins();

        localPlugin = testRig.localDevice._plugins.get('photo');
        remotePlugin = testRig.remoteDevice._plugins.get('photo');

        expect(localPlugin).toBeDefined();
        expect(remotePlugin).toBeDefined();
    });

    it('enables its GActions when connected', function () {
        testRig.setConnected(true);

        expect(localPlugin.device.get_action_enabled('photo')).toBe(true);
        expect(remotePlugin.device.get_action_enabled('photo')).toBe(true);
    });

    it('can request and receive photos', async function () {
        spyOn(remotePlugin, '_sendPhoto');

        localPlugin.photo();
        await remotePlugin.awaitPacket('kdeconnect.photo.request');

        expect(remotePlugin._sendPhoto).toHaveBeenCalled();
    });

    it('disables its GActions when disconnected', function () {
        testRig.setConnected(false);

        expect(localPlugin.device.get_action_enabled('photo')).toBe(false);
        expect(remotePlugin.device.get_action_enabled('photo')).toBe(false);
    });
});

