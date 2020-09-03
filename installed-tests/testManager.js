'use strict';

const {GLib} = imports.gi;

const Mock = imports.fixtures.utils;

const Manager = imports.service.manager;


// TODO: * device management
//       * DBus
describe('Manager', function () {
    let manager;

    beforeAll(function () {
        manager = new Manager.Manager({
            object_path: '/org/gnome/Shell/Extensions/GSConnect/Test',
        });

        spyOn(manager, '_loadDevices').and.callThrough();
        spyOn(manager, '_loadBackends');
    });

    afterAll(function () {
        manager.destroy();
    });

    it('can be started', function () {
        manager.start();

        expect(manager.active).toBe(true);
        expect(manager._loadDevices).toHaveBeenCalled();
        expect(manager._loadBackends).toHaveBeenCalled();
    });

    it('can be stopped', function () {
        manager.stop();

        expect(manager.active).toBe(false);
        expect(manager.devices.size).toBe(0);
        expect(manager.backends.size).toBe(0);
    });
});

