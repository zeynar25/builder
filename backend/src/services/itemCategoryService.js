import ItemCategory from "../models/ItemCategory.js";

export async function listCategories({ page = 1, limit = 100 } = {}) {
  page = Math.max(1, page);
  limit = Math.max(1, limit);
  const categories = await ItemCategory.find({ isActive: true })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();
  return { page, limit, categories };
}

export async function createCategory({ name, description }) {
  const cat = await ItemCategory.create({ name, description });
  return cat;
}

export async function getCategoryById(id) {
  const cat = await ItemCategory.findById(id).lean().exec();
  if (!cat || !cat.isActive) return null;
  return cat;
}

export async function updateCategoryById(id, updates) {
  const cat = await ItemCategory.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).exec();
  return cat;
}

export async function softDeleteCategoryById(id) {
  const cat = await ItemCategory.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
  return cat;
}

export default { listCategories, createCategory, getCategoryById, updateCategoryById, softDeleteCategoryById };
