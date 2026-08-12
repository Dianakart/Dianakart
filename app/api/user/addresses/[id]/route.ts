import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import {
  USER_SESSION_COOKIE_NAME,
  verifyUserToken,
} from "@/lib/userAuth";
import User from "@/models/User";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateAddressBody {
  label?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  isDefault?: boolean;
}

async function getCustomerSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    USER_SESSION_COOKIE_NAME
  )?.value;

  return verifyUserToken(token);
}

// Update address or set it as default
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to update an address.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid address ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as UpdateAddressBody;

    await connectDB();

    const user = await User.findById(
      session.userId
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer account not found.",
        },
        {
          status: 404,
        }
      );
    }

    const savedAddress = user.addresses.find(
  (item: import("@/models/User").UserAddress) =>
    item._id?.toString() === id
);

    if (!savedAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "Address not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (body.isDefault === true) {
      user.addresses.forEach(
  (item: import("@/models/User").UserAddress) => {
    item.isDefault =
      item._id?.toString() === id;
  }
);
    }

    if (
      typeof body.label === "string"
    ) {
      savedAddress.label =
        body.label.trim() || "Home";
    }

    if (
      typeof body.fullName === "string"
    ) {
      savedAddress.fullName =
        body.fullName.trim();
    }

    if (typeof body.phone === "string") {
      const cleanPhone =
        body.phone.replace(/\D/g, "");

      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter a valid 10-digit Indian phone number.",
          },
          {
            status: 400,
          }
        );
      }

      savedAddress.phone = cleanPhone;
    }

    if (
      typeof body.address === "string"
    ) {
      savedAddress.address =
        body.address.trim();
    }

    if (typeof body.city === "string") {
      savedAddress.city =
        body.city.trim();
    }

    if (typeof body.state === "string") {
      savedAddress.state =
        body.state.trim();
    }

    if (
      typeof body.pinCode === "string"
    ) {
      const cleanPinCode =
        body.pinCode.replace(/\D/g, "");

      if (!/^\d{6}$/.test(cleanPinCode)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter a valid 6-digit PIN code.",
          },
          {
            status: 400,
          }
        );
      }

      savedAddress.pinCode =
        cleanPinCode;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message:
        body.isDefault === true
          ? "Default address updated."
          : "Address updated successfully.",
      address: savedAddress,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error(
      "UPDATE CUSTOMER ADDRESS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update address.",
      },
      {
        status: 500,
      }
    );
  }
}

// Delete address
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to delete an address.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid address ID.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const user = await User.findById(
      session.userId
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer account not found.",
        },
        {
          status: 404,
        }
      );
    }

    const addressIndex =
  user.addresses.findIndex(
    (item: import("@/models/User").UserAddress) =>
      item._id?.toString() === id
  );

    if (addressIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Address not found.",
        },
        {
          status: 404,
        }
      );
    }

    const deletedAddress =
      user.addresses[addressIndex];

    const wasDefault =
      deletedAddress.isDefault;

    user.addresses.splice(
      addressIndex,
      1
    );

    if (
      wasDefault &&
      user.addresses.length > 0
    ) {
      user.addresses[0].isDefault =
        true;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message:
        "Address deleted successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error(
      "DELETE CUSTOMER ADDRESS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete address.",
      },
      {
        status: 500,
      }
    );
  }
}