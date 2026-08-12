import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export interface IWebsiteSettings extends Document {
  storeName: string;
  logoUrl: string;

  contactNumber: string;
  email: string;
  address: string;

  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;

  footerText: string;

  seoTitle: string;
  seoDescription: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const websiteSettingsSchema =
  new Schema<IWebsiteSettings>(
    {
      storeName: {
        type: String,
        trim: true,
        default: "DianaKart",
      },

      logoUrl: {
        type: String,
        trim: true,
        default: "/logo.png",
      },

      contactNumber: {
        type: String,
        trim: true,
        default: "",
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      address: {
        type: String,
        trim: true,
        default: "",
      },

      instagramUrl: {
        type: String,
        trim: true,
        default: "",
      },

      facebookUrl: {
        type: String,
        trim: true,
        default: "",
      },

      whatsappNumber: {
        type: String,
        trim: true,
        default: "",
      },

      footerText: {
        type: String,
        trim: true,
        default:
          "© DianaKart. All rights reserved.",
      },

      seoTitle: {
        type: String,
        trim: true,
        default:
          "DianaKart - Women Fashion Store",
      },

      seoDescription: {
        type: String,
        trim: true,
        default:
          "Shop dresses, handbags, footwear, jewellery and beauty products at DianaKart.",
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const WebsiteSettings: Model<IWebsiteSettings> =
  mongoose.models.WebsiteSettings ||
  mongoose.model<IWebsiteSettings>(
    "WebsiteSettings",
    websiteSettingsSchema
  );

export default WebsiteSettings;