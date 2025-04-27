import express from "express";
import * as store from "../data/store.js";
import { validate } from "../utils/helpers.js";
import {
    createDeviceValidation,
    listDevicesValidation,
    deleteDeviceValidation,
} from "../validators/devicesValidators.js";

// needed to allow /profiles/:userId/devices
const router = express.Router({ mergeParams: true });

// GET /profiles/:userId/devices - this endpoint is used to list devices for a user
router.get("/", validate(listDevicesValidation), (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!store.profileExistsById(userId)) {
            return res
                .status(404)
                .json({ success: false, message: "User profile not found" });
        }

        const devices = store.findDevicesByUserId(userId);
        res.status(200).json(devices);
    } catch (err) {
        next(err);
    }
});

// POST /profiles/:userId/devices - this endpoint is used to add a device for a user
router.post("/", validate(createDeviceValidation), (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!store.profileExistsById(userId)) {
            return res
                .status(404)
                .json({ success: false, message: "User profile not found" });
        }

        const { deviceName, deviceType } = req.body;
        const device = store.addDevice(userId, { deviceName, deviceType });
        res.status(201).json(device);
    } catch (err) {
        next(err);
    }
});

// DELETE /profiles/:userId/devices/:deviceId - this endpoint is used to delete a device for a user
router.delete("/:deviceId", validate(deleteDeviceValidation), (req, res, next) => {
    try {
        const { userId, deviceId } = req.params;

        if (!store.profileExistsById(userId)) {
            return res
                .status(404)
                .json({ success: false, message: "User profile not found" });
        }

        const device = store.findDeviceById(deviceId);

        if (!device) {
            return res
                .status(404)
                .json({ success: false, message: "Device record not found" });
        }

        if (device.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this device record",
            });
        }

        const deleted = store.removeDeviceById(deviceId);

        if (deleted) {
            return res
                .status(200)
                .json({ success: true, message: "Device record deleted successfully" });
        } else {
            return res
                .status(500)
                .json({ success: false, message: "Failed to delete device record" });
        }
    } catch (err) {
        next(err);
    }
});

export default router;
