import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Completed";

export interface IOrderItem {
  productId: string;
  sku?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
}

export interface IOrder
  extends Document {
  orderId: string;

  userId: string;

  customerName: string;
  phone: string;
  email?: string;

  address: string;
  city: string;
  state: string;
  pinCode: string;

  items: IOrderItem[];

  totalItems: number;
  totalAmount: number;

  paymentMethod: "COD";

  status: OrderStatus;

  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema =
  new Schema<IOrderItem>(
    {
      productId: {
        type: String,
        required: true,
        trim: true,
      },

      sku: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      image: {
        type: String,
        default: "",
        trim: true,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      size: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

const orderSchema =
  new Schema<IOrder>(
    {
      orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },

      userId: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      customerName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pinCode: {
        type: String,
        required: true,
        trim: true,
      },

      items: {
        type: [orderItemSchema],
        required: true,

        validate: {
          validator: (
            items: IOrderItem[]
          ) => {
            return (
              Array.isArray(items) &&
              items.length > 0
            );
          },

          message:
            "At least one order item is required.",
        },
      },

      totalItems: {
        type: Number,
        required: true,
        min: 1,
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      paymentMethod: {
        type: String,
        enum: ["COD"],
        default: "COD",
      },

      status: {
        type: String,

        enum: [
          "Pending",
          "Confirmed",
          "Completed",
        ],

        default: "Pending",

        index: true,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>(
    "Order",
    orderSchema
  );

export default Order;