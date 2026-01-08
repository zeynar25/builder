import accountDetailService from "../services/accountDetailService.js";

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

export default { updateGameNameByAccount, updateGameNameById };
