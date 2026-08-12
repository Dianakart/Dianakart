import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export interface IBanner extends Document {
  title: string;
  subtitle: string;

  desktopImage: string;
  mobileImage: string;

  buttonText: string;
  buttonLink: string;

  displayOrder: number;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },

    subtitle: {
      type: String,
      trim: true,
      default: "",
    },

    desktopImage: {
      type: String,
      required: [
        true,
        "Desktop banner image is required",
      ],
      trim: true,
    },

    mobileImage: {
      type: String,
      trim: true,
      default: "",
    },

    buttonText: {
      type: String,
      trim: true,
      default: "Shop Now",
    },

    buttonLink: {
      type: String,
      trim: true,
      default: "/",
    },

    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
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

bannerSchema.index({
  displayOrder: 1,
  createdAt: -1,
});

const Banner: Model<IBanner> =
  mongoose.models.Banner ||
  mongoose.model<IBanner>(
    "Banner",
    bannerSchema
  );

export default Banner;