'use strict';

const Mock = imports.fixtures.utils;


describe('The findmyphone plugin', function () {
    let testRig;
    let localPlugin, remotePlugin;

    beforeAll(async function () {
        Mock.mockComponents();

        testRig = new Mock.TestRig();
        await testRig.prepare({
            localDevice: {
                incomingCapabilities: ['kdeconnect.findmyphone.request'],
                outgoingCapabilities: ['kdeconnect.findmyphone.request'],
            },
            remoteDevice: {
                incomingCapabilities: ['kdeconnect.findmyphone.request'],
                outgoingCapabilities: ['kdeconnect.findmyphone.request'],
            },
        });
        testRig.setPaired(true);
    });

    afterAll(function () {
        testRig.destroy();
    });

    beforeEach(function () {
        if (localPlugin && remotePlugin) {
            spyOn(remotePlugin, 'handlePacket').and.callThrough();
            spyOn(remotePlugin, '_handleRequest');
        }
    });

    it('can be loaded', async function () {
        await testRig.loadPlugins();

        localPlugin = testRig.localDevice._plugins.get('findmyphone');
        remotePlugin = testRig.remoteDevice._plugins.get('findmyphone');

        expect(localPlugin).toBeDefined();
        expect(remotePlugin).toBeDefined();
    });

    it('enables its GActions when connected', function () {
        testRig.setConnected(true);

        expect(localPlugin.device.get_action_enabled('ring')).toBe(true);
        expect(remotePlugin.device.get_action_enabled('ring')).toBe(true);
    });

    it('can send and receive ring requests', async function () {
        localPlugin.ring();

        await remotePlugin.awaitPacket('kdeconnect.findmyphone.request');
        expect(remotePlugin._handleRequest).toHaveBeenCalled();
    });

    it('stops ringing on the second request', async function () {
        localPlugin.ring();

        await remotePlugin.awaitPacket('kdeconnect.findmyphone.request');
        expect(remotePlugin._handleRequest).toHaveBeenCalled();
    });

    it('enables its GActions when connected', function () {
        testRig.setConnected(false);

        expect(localPlugin.device.get_action_enabled('ring')).toBe(false);
        expect(remotePlugin.device.get_action_enabled('ring')).toBe(false);
    });
});

