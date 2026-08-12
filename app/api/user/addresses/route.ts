import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectDB } from "@/lib/mongodb";

import {
  USER_SESSION_COOKIE_NAME,
  verifyUserToken,
} from "@/lib/userAuth";

import User, {
  UserAddress,
} from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AddressRequestBody {
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
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      USER_SESSION_COOKIE_NAME
    )?.value;

  return verifyUserToken(
    token
  );
}

/* ========================================
   GET - LOAD SAVED ADDRESSES
======================================== */

export async function GET() {
  try {
    const session =
      await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to view saved addresses.",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const user =
      await User.findById(
        session.userId
      )
        .select(
          "name email phone addresses"
        )
        .lean();

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

    return NextResponse.json({
      success: true,

      user: {
        id:
          user._id.toString(),

        name:
          user.name,

        email:
          user.email,

        phone:
          user.phone,
      },

      addresses:
        user.addresses ||
        [],
    });
  } catch (error) {
    console.error(
      "GET CUSTOMER ADDRESSES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load saved addresses.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ========================================
   POST - ADD NEW ADDRESS
======================================== */

export async function POST(
  request: NextRequest
) {
  try {
    const session =
      await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to save an address.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as AddressRequestBody;

    /* ----------------------------
       CLEAN VALUES
    ---------------------------- */

    const label =
      typeof body.label ===
        "string" &&
      body.label.trim()
        ? body.label.trim()
        : "Home";

    const fullName =
      String(
        body.fullName ||
          ""
      ).trim();

    const phone =
      String(
        body.phone || ""
      )
        .replace(
          /\D/g,
          ""
        )
        .trim();

    const address =
      String(
        body.address ||
          ""
      ).trim();

    const city =
      String(
        body.city || ""
      ).trim();

    const state =
      String(
        body.state || ""
      ).trim();

    const pinCode =
      String(
        body.pinCode ||
          ""
      )
        .replace(
          /\D/g,
          ""
        )
        .trim();

    /* ----------------------------
       REQUIRED FIELDS
    ---------------------------- */

    if (
      !fullName ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pinCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please fill in all required address details.",
        },
        {
          status: 400,
        }
      );
    }

    /* ----------------------------
       PHONE
    ---------------------------- */

    if (
      !/^[6-9]\d{9}$/.test(
        phone
      )
    ) {
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

    /* ----------------------------
       PIN CODE
    ---------------------------- */

    if (
      !/^\d{6}$/.test(
        pinCode
      )
    ) {
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

    await connectDB();

    const user =
      await User.findById(
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

    /* ----------------------------
       DEFAULT ADDRESS
    ---------------------------- */

    const shouldBeDefault =
      user.addresses
        .length === 0 ||
      body.isDefault ===
        true;

    if (
      shouldBeDefault
    ) {
      user.addresses.forEach(
        (
          savedAddress: UserAddress
        ) => {
          savedAddress.isDefault =
            false;
        }
      );
    }

    /* ----------------------------
       CREATE ADDRESS
    ---------------------------- */

    const newAddress: UserAddress =
      {
        label,
        fullName,
        phone,
        address,
        city,
        state,
        pinCode,

        isDefault:
          shouldBeDefault,
      };

    user.addresses.push(
      newAddress
    );

    await user.save();

    const savedAddress =
      user.addresses[
        user.addresses
          .length - 1
      ];

    return NextResponse.json(
      {
        success: true,

        message:
          "Address saved successfully.",

        address:
          savedAddress,

        addresses:
          user.addresses,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ADD CUSTOMER ADDRESS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save address.",
      },
      {
        status: 500,
      }
    );
  }
}