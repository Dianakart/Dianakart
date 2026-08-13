import mongoose, {
  Model,
  Schema,
} from "mongoose";

export interface ProductVariant {
  color: string;
  sizes: string[];
}

export interface ProductDocument {
  name: string;
  sku: string;
  brand: string;
  category: string;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  image: string;
  images: string[];
  variants: ProductVariant[];
  description: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema =
  new Schema<ProductVariant>(
    {
      color: {
        type: String,
        trim: true,
        default: "",
      },

      sizes: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

const ProductSchema =
  new Schema<ProductDocument>(
    {
      name: {
        type: String,
        required: [
          true,
          "Product name is required",
        ],
        trim: true,
      },

      sku: {
        type: String,
        required: [
          true,
          "Product SKU is required",
        ],
        unique: true,
        trim: true,
        uppercase: true,
      },

      brand: {
        type: String,
        trim: true,
        default: "",
      },

      category: {
        type: String,
        required: [
          true,
          "Category is required",
        ],
        trim: true,
      },

      supplier: {
        type: String,
        trim: true,
        default: "",
      },

      costPrice: {
        type: Number,
        required: [
          true,
          "Cost price is required",
        ],
        min: [
          0,
          "Cost price cannot be negative",
        ],
      },

      sellingPrice: {
        type: Number,
        required: [
          true,
          "Selling price is required",
        ],
        min: [
          0,
          "Selling price cannot be negative",
        ],
      },

      image: {
        type: String,
        trim: true,
        default: "",
      },

      images: {
        type: [String],
        default: [],
      },

      variants: {
        type: [VariantSchema],
        default: [],
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "Active",
          "Inactive",
        ],
        default: "Active",
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

const Product: Model<ProductDocument> =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>(
    "Product",
    ProductSchema
  );

export default Product;