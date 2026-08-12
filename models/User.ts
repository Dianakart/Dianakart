import mongoose, {
  Model,
  Schema,
} from "mongoose";

export interface UserAddress {
  _id?: mongoose.Types.ObjectId;

  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export interface UserDocument {
  name: string;
  email: string;
  password: string;
  phone: string;

  addresses: UserAddress[];

  isActive: boolean;

  passwordResetToken?: string;
  passwordResetExpires?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema =
  new Schema<UserAddress>(
    {
      label: {
        type: String,
        trim: true,
        default: "Home",
      },

      fullName: {
        type: String,
        required: [
          true,
          "Full name is required",
        ],
        trim: true,
      },

      phone: {
        type: String,
        required: [
          true,
          "Phone number is required",
        ],
        trim: true,
      },

      address: {
        type: String,
        required: [
          true,
          "Address is required",
        ],
        trim: true,
      },

      city: {
        type: String,
        required: [
          true,
          "City is required",
        ],
        trim: true,
      },

      state: {
        type: String,
        required: [
          true,
          "State is required",
        ],
        trim: true,
      },

      pinCode: {
        type: String,
        required: [
          true,
          "PIN code is required",
        ],
        trim: true,
      },

      isDefault: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: true,
    }
  );

const UserSchema =
  new Schema<UserDocument>(
    {
      name: {
        type: String,
        required: [
          true,
          "Name is required",
        ],
        trim: true,
      },

      email: {
        type: String,
        required: [
          true,
          "Email is required",
        ],
        unique: true,
        lowercase: true,
        trim: true,
      },

      password: {
        type: String,
        required: [
          true,
          "Password is required",
        ],
        minlength: 6,
        select: false,
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },

      addresses: {
        type: [AddressSchema],
        default: [],
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      passwordResetToken: {
        type: String,
        default: "",
      },

      passwordResetExpires: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

const User: Model<UserDocument> =
  mongoose.models.User ||
  mongoose.model<UserDocument>(
    "User",
    UserSchema
  );

export default User;