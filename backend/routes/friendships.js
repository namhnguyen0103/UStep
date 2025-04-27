import express from "express";
import * as store from "../data/store.js";
import { validate } from "../utils/helpers.js";
import {
  createFriendshipValidation,
  userIdParamValidation,
  friendshipIdParamValidation,
} from "../validators/friendshipsValidators.js";

const router = express.Router();

// POST /friendships - this endpoint is used to create a friendship
/*
{
  "userId": "user-id-value",
  "friendId": "friend-id-value"
} 
*/
router.post("/", validate(createFriendshipValidation), (req, res, next) => {
  try {
    if (
      !store.profileExistsById(req.body.userId) ||
      !store.profileExistsById(req.body.friendId)
    ) {
      return res
        .status(404)
        .json({ success: false, message: "One or both users not found" });
    }

    if (store.findFriendshipBetweenUsers(req.body.userId, req.body.friendId)) {
      return res
        .status(409)
        .json({ success: false, message: "Friendship already exists" });
    }

    store.addFriendship(req.body);
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /friendships/user/:id - this endpoint is used to get the friends of a user
router.get("/user/:id", validate(userIdParamValidation), (req, res, next) => {
  try {
    if (!store.profileExistsById(req.params.id)) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const friends = store.findFriendsByUserId(req.params.id);
    res.status(200).json(friends);
  } catch (err) {
    next(err);
  }
});

// DELETE /friendships/:id - this endpoint is used to remove a friendship by its record ID
router.delete(
  "/:id",
  validate(friendshipIdParamValidation),
  (req, res, next) => {
    try {
      const deleted = store.removeFriendshipById(req.params.id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Friendship record not found" });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  validate(friendshipIdParamValidation),
  validate(createFriendshipValidation),
  (req, res, next) => {
    try {
      if (
        !store.profileExistsById(req.body.userId) ||
        !store.profileExistsById(req.body.friendId)
      ) {
        return res.status(404).json({ success: false, message: "One or both users not found" });
      }

      const updated = store.updateFriendshipById(req.params.id, {
        userId: req.body.userId,
        friendId: req.body.friendId,
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: "Friendship record not found" });
      }

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);


export default router;
