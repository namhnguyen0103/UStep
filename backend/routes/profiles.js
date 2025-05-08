import express from 'express';
import * as store from '../data/store.js';
import { validate } from '../utils/helpers.js';
import {
  createProfileValidation,
  profileIdParamValidation,
  searchQueryValidation,
} from '../validators/profilesValidators.js';
import crypto from 'crypto';

const router = express.Router();

// POST /profiles - This endpoint is used to create a new profile
router.post('/', validate(createProfileValidation), async (req, res, next) => {
  try {
    const profileId = crypto.randomUUID();

    if (await store.profileExistsByEmail(req.body.email)) {
      return res.status(409).json({
        success: false,
        message: 'Profile already exists',
      });
    }

    const profileData = {
      id: profileId,
      email: req.body.email,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
    };

    await store.addProfile(profileData);
    res.status(201).json({ success: true, id: profileId });
  } catch (err) {
    next(err);
  }
});

// GET /profiles/exists/:id - this endpoint is used to check if a profile exists by id
router.get(
  '/exists/:id',
  validate(profileIdParamValidation),
  async (req, res, next) => {
    try {
      const exists = await store.profileExistsById(req.params.id);
      res.status(200).json({ exists });
    } catch (err) {
      next(err);
    }
  },
);

// GET /profiles/search?query=... - this endpoint is used to search for profiles by query
router.get(
  '/search',
  validate(searchQueryValidation),
  async (req, res, next) => {
    try {
      const results = await store.searchProfiles(req.query.query);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  },
);

// GET /profiles/:id - this endpoint is used to get a profile by id
router.get(
  '/:id',
  validate(profileIdParamValidation),
  async (req, res, next) => {
    try {
      const profile = await store.getProfileById(req.params.id);
      if (!profile) {
        return res
          .status(404)
          .json({ success: false, message: 'Profile not found' });
      }
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  validate(profileIdParamValidation),
  validate(createProfileValidation),
  async (req, res, next) => {
    try {
      if (!(await store.profileExistsById(req.params.id))) {
        return res
          .status(404)
          .json({ success: false, message: 'Profile not found' });
      }
      const updated = await store.updateProfile(req.params.id, {
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
      });
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: 'Profile not found' });
      }
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  validate(profileIdParamValidation),
  async (req, res, next) => {
    try {
      const deleted = await store.removeProfileById(req.params.id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: 'Profile not found' });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
