import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({
                message: "Dimohon diisi namanya",
            }, {
                status: 400,
            });
        }

        const user = await db.user.update({
            where: {
                id: params.userId,
            },
            data: {
                name,
            },
        });

        return NextResponse.json({
            message: "User berhasil di update",
            user,
        }, {
            status: 200,
        });
    } catch (error) {
        console.log("[USER_PATCH]", error);
        return NextResponse.json({
            message: "Internal error",
        }, {
            status: 500,
        });
    }
}

export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
    try {
        const user = await db.user.delete({
            where: {
                id: params.userId,
            },
        });

        return NextResponse.json({
            message: "User berhasil di delete",
            user,
        }, {
            status: 200,
        });
    } catch (error) {
        console.log("[USER_DELETE]", error);
        return NextResponse.json({
            message: "Internal error",
        }, {
            status: 500,
        });
    }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(req: Request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*', // Or specify your client domain
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400', // 24 hours
        },
    });
}

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    // Define CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Or specify your client domain
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    try {
        const user = await db.user.findUnique({
            where: {
                id: params.userId,
            },
        });

        if (!user) {
            return NextResponse.json({
                message: "User not found",
            }, {
                status: 404,
                headers: corsHeaders,
            });
        }

        return NextResponse.json({
            name: user?.name,
            email: user?.email,
            createdAt: user?.createdAt,
        }, {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.log("[USER_GET]", error);
        return NextResponse.json({
            message: "Internal error",
        }, {
            status: 500,
            headers: corsHeaders
        });
    }
}
