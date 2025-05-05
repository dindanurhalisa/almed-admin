import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import db from "@/lib/db";
import { PaymentMethod } from "@prisma/client";

// Define CORS headers directly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const body = await req.json();

    const {
      name,
      userId,
      phone,
      address,
      postCode,
      paymentMethod,
      totalPay,
      orderItems
    } = body;

    // Log the request for debugging
    console.log("[TRANSACTIONS_POST] Request:", {
      storeId: params.storeId,
      body
    });

    if (!name) {
      console.log("[TRANSACTIONS_POST] Nama perlu diinput");
      return new NextResponse("Nama perlu diinput", { status: 400 });
    }

    if (!userId) {
      console.log("[TRANSACTIONS_POST] User ID perlu diinput");
      return new NextResponse("User ID perlu diinput", { status: 400 });
    }

    if (!phone) {
      console.log("[TRANSACTIONS_POST] Nomor telepon perlu diinput");
      return new NextResponse("Nomor telepon perlu diinput", { status: 400 });
    }

    if (!address) {
      console.log("[TRANSACTIONS_POST] Alamat perlu diinput");
      return new NextResponse("Alamat perlu diinput", { status: 400 });
    }

    if (!postCode) {
      console.log("[TRANSACTIONS_POST] Kode pos perlu diinput");
      return new NextResponse("Kode pos perlu diinput", { status: 400 });
    }

    if (!paymentMethod) {
      console.log("[TRANSACTIONS_POST] Metode pembayaran perlu diinput");
      return new NextResponse("Metode pembayaran perlu diinput", { status: 400 });
    }

    if (!totalPay) {
      console.log("[TRANSACTIONS_POST] Total pembayaran perlu diinput");
      return new NextResponse("Total pembayaran perlu diinput", { status: 400 });
    }

    if (!orderItems || !orderItems.length) {
      console.log("[TRANSACTIONS_POST] Produk perlu diinput");
      return new NextResponse("Produk perlu diinput", { status: 400 });
    }

    if (!params.storeId) {
      console.log("[TRANSACTIONS_POST] Store id URL dibutuhkan");
      return new NextResponse("Store id URL dibutuhkan");
    }

    const storeByStoreId = await db.store.findFirst({
      where: {
        id: params.storeId,
      },
    });

    if (!storeByStoreId) {
      console.log("[TRANSACTIONS_POST] Store tidak ditemukan");
      return new NextResponse("Store tidak ditemukan", { status: 404 });
    }

    // Calculate total amount
    let totalAmount = 0;

    // Validate products and calculate total
    for (const item of orderItems) {
      const product = await db.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        console.log("[TRANSACTIONS_POST] Produk dengan ID ${item.productId} tidak ditemukan");
        return new NextResponse(`Produk dengan ID ${item.productId} tidak ditemukan`, { status: 400 });
      }

      if (product.stock < item.quantity) {
        console.log("[TRANSACTIONS_POST] Stok tidak cukup untuk produk ${product.name}");
        return new NextResponse(`Stok tidak cukup untuk produk ${product.name}`, { status: 400 });
      }

      totalAmount += Number(product.price) * item.quantity;
    }

    const discount = totalAmount - totalPay;

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        name,
        userId,
        phone,
        address,
        postCode,
        paymentMethod,
        totalAmount: totalPay,
        isPaid: paymentMethod === "WHATSAPP" ? true : false,
        storeId: params.storeId,
        orderItems: {
          createMany: {
            data: orderItems.map((item: { productId: string; quantity: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: 0, // Will be updated below
            })),
          },
        },
      },
      include: {
        orderItems: true
      }
    });

    // Update order items with correct prices and update product stock
    for (const item of transaction.orderItems) {
      const product = await db.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (product) {
        // Update order item price
        await db.orderItem.update({
          where: {
            id: item.id,
          },
          data: {
            price: product.price,
          },
        });

        // Update product stock
        await db.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: product.stock - item.quantity,
          },
        });
      }
    }

    // Fetch the updated transaction
    const updatedTransaction = await db.transaction.findUnique({
      where: {
        id: transaction.id,
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedTransaction, { headers: corsHeaders });
  } catch (error) {
    console.log("[TRANSACTIONS_POST]", error);
    if (error instanceof Error) {
      return new NextResponse(`Internal error: ${error.message}`, { status: 500, headers: corsHeaders });
    } else {
      return new NextResponse(`Internal error: ${error}`, { status: 500, headers: corsHeaders });
    }
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const isPaid = searchParams.get("isPaid");
    const paymentMethod = searchParams.get("paymentMethod") as PaymentMethod;
    const userId = searchParams.get("userId");

    console.log("[TRANSACTIONS_GET] Request:", {
      storeId: params.storeId,
      isPaid,
      paymentMethod,
      userId
    });

    if (!params.storeId) {
      return new NextResponse("Store id URL dibutuhkan", { status: 400, headers: corsHeaders });
    }

    // Verify the store exists
    const store = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!store) {
      return new NextResponse("Store tidak ditemukan", { status: 404, headers: corsHeaders });
    }

    const transactions = await db.transaction.findMany({
      where: {
        storeId: params.storeId,
        isPaid: isPaid ? isPaid === "true" : undefined,
        paymentMethod: paymentMethod || undefined,
        userId: userId || undefined,
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions, { headers: corsHeaders });
  } catch (error) {
    console.log("[TRANSACTIONS_GET]", error);

    if (error instanceof Error) {
      return new NextResponse(`Internal error: ${error.message}`, { status: 500, headers: corsHeaders });
    } else {
      return new NextResponse(`Internal error: ${error}`, { status: 500, headers: corsHeaders });
    }
  }
}
