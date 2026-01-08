import categoryService from "../services/itemCategoryService.js";

export async function listCategories(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 100);
    const result = await categoryService.listCategories({ page, limit });
    return res.json(result);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "cannot_list_categories" });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });
    const cat = await categoryService.createCategory({ name, description });
    return res.status(201).json(cat);
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "cannot_create_category" });
  }
}

export async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const cat = await categoryService.getCategoryById(id);
    if (!cat) return res.status(404).json({ error: "not_found" });
    return res.json(cat);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "cannot_get_category" });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const cat = await categoryService.updateCategoryById(id, updates);
    if (!cat) return res.status(404).json({ error: "not_found" });
    return res.json(cat);
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "cannot_update_category" });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const cat = await categoryService.softDeleteCategoryById(id);
    if (!cat) return res.status(404).json({ error: "not_found" });
    return res.json({ success: true, category: cat });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "cannot_delete_category" });
  }
}

export default {
  listCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};
