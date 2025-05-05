import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import db from "@/lib/db";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string; transactionId: string } }
) {
  try {
    console.log("[TRANSACTION_GET] Request:", {
      storeId: params.storeId,
      transactionId: params.transactionId
    });
    
    if (!params.transactionId) {
      return new NextResponse("Transaction ID dibutuhkan", { status: 400, headers: corsHeaders });
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

    const transaction = await db.transaction.findUnique({
      where: {
        id: params.transactionId,
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

    if (!transaction) {
      return new NextResponse("Transaction tidak ditemukan", { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(transaction, { headers: corsHeaders });
  } catch (error) {
    console.log("[TRANSACTION_GET]", error);
    if (error instanceof Error) {
      return new NextResponse(`Internal error: ${error.message}`, { status: 500, headers: corsHeaders });
    } else {
      return new NextResponse(`Internal error: ${error}`, { status: 500, headers: corsHeaders });
    }
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { storeId: string; transactionId: string } }
) {
  try {
    const body = await req.json();

    const { isPaid } = body;
    
    console.log("[TRANSACTION_PATCH] Request:", {
      storeId: params.storeId,
      transactionId: params.transactionId,
      body
    });

    if (!params.transactionId) {
      return new NextResponse("Transaction ID dibutuhkan", { status: 400, headers: corsHeaders });
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

    const transaction = await db.transaction.update({
      where: {
        id: params.transactionId,
      },
      data: {
        isPaid: isPaid !== undefined ? isPaid : undefined,
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

    return NextResponse.json(transaction, { headers: corsHeaders });
  } catch (error) {
    console.log("[TRANSACTION_PATCH]", error);
    if (error instanceof Error) {
      return new NextResponse(`Internal error: ${error.message}`, { status: 500, headers: corsHeaders });
    } else {
      return new NextResponse(`Internal error: ${error}`, { status: 500, headers: corsHeaders });
    }
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { storeId: string; transactionId: string } }
) {
  try {
    console.log("[TRANSACTION_DELETE] Request:", {
      storeId: params.storeId,
      transactionId: params.transactionId
    });
    
    if (!params.transactionId) {
      return new NextResponse("Transaction ID dibutuhkan", { status: 400, headers: corsHeaders });
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

    // First, get the transaction to access its order items
    const transaction = await db.transaction.findUnique({
      where: {
        id: params.transactionId,
      },
      include: {
        orderItems: true,
      },
    });

    if (!transaction) {
      return new NextResponse("Transaction tidak ditemukan", { status: 404, headers: corsHeaders });
    }

    // If the transaction is found, restore the product stock for each order item
    for (const item of transaction.orderItems) {
      const product = await db.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (product) {
        await db.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: product.stock + item.quantity,
          },
        });
      }
    }

    // Delete the transaction (this will cascade delete the order items)
    await db.transaction.delete({
      where: {
        id: params.transactionId,
      },
    });

    return NextResponse.json({ message: "Transaction berhasil dihapus" }, { headers: corsHeaders });
  } catch (error) {
    console.log("[TRANSACTION_DELETE]", error);
    if (error instanceof Error) {
      return new NextResponse(`Internal error: ${error.message}`, { status: 500, headers: corsHeaders });
    } else {
      return new NextResponse(`Internal error: ${error}`, { status: 500, headers: corsHeaders });
    }
  }
}
