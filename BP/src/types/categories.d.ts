interface Subcategory {
  id: string
  name: string
  count: number
  image: string
}

interface Category {
  id: string
  name: string
  displayName: string
  subcategories: Subcategory[]
}

interface CategoriesJson {
  categories: Category[]
}

declare module '@/data/categories.json' {
  const value: CategoriesJson
  export default value
}
