import accountDetailService from "../services/accountDetailService.js";

export async function getAccountDetailById(req, res) {
  try {
    const { id } = req.params;
    const accountDetail = await accountDetailService.getAccountDetailById(id);
    if (!accountDetail)
      return res.status(404).json({ error: "accountDetail_not_found" });
    return res.json({ success: true, accountDetail });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "cannot_get_accountDetail" });
  }
}

export async function updateGameNameByAccount(req, res) {
  try {
    const { accountId } = req.params;
    const { gameName } = req.body;
    if (!gameName) return res.status(400).json({ error: "gameName_required" });

    const updated = await accountDetailService.updateGameNameByAccount(
      accountId,
      gameName
    );
    if (!updated)
      return res.status(404).json({ error: "account_or_detail_not_found" });
    return res.json({ success: true, accountDetail: updated });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "cannot_update_gameName" });
  }
}

export async function updateGameNameById(req, res) {
  try {
    const { id } = req.params;
    const { gameName } = req.body;
    if (!gameName) return res.status(400).json({ error: "gameName_required" });

    const updated = await accountDetailService.updateGameNameById(id, gameName);
    if (!updated) return res.status(404).json({ error: "not_found" });
    return res.json({ success: true, accountDetail: updated });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "cannot_update_gameName" });
  }
}

export async function addChronById(req, res) {
  try {
    const { id } = req.params;
    const { minutes } = req.body;
    const mins = Math.floor(Number(minutes || 0));
    if (mins <= 0)
      return res.status(400).json({ error: "minutes_required_positive" });

    const updated = await accountDetailService.addChronById(id, mins);
    if (!updated)
      return res.status(404).json({ error: "accountDetail_not_found" });
    return res.json({ success: true, accountDetail: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || "cannot_add_chron" });
  }
}

export async function uploadProfileImageById(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "image_required" });
    }

    const filename = req.file.filename;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/profiles/${filename}`;

    const updated = await accountDetailService.updateImageById(id, imageUrl);
    if (!updated) return res.status(404).json({ error: "not_found" });

    return res.json({ success: true, accountDetail: updated });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "cannot_upload_profile_image" });
  }
}

export async function updateProfileAvatarById(req, res) {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    // Restrict to known bundled profile filenames for safety
    const allowed = ["1.png", "2.png", "3.png", "4.png", "5.png"];
    if (!imageUrl || !allowed.includes(imageUrl)) {
      return res.status(400).json({ error: "invalid_profile_avatar" });
    }

    const updated = await accountDetailService.updateImageById(id, imageUrl);
    if (!updated) return res.status(404).json({ error: "not_found" });

    return res.json({ success: true, accountDetail: updated });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "cannot_update_profile_avatar" });
  }
}

export default {
  getAccountDetailById,
  updateGameNameByAccount,
  updateGameNameById,
  addChronById,
  uploadProfileImageById,
  updateProfileAvatarById,
};
