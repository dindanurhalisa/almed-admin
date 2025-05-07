import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

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

export async function POST(req: Request) {
    // Define CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Or specify your client domain
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({
                message: "Please provide email and password",
            }, {
                status: 400,
                headers: corsHeaders,
            });
        }

        const user = await db.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            return NextResponse.json({
                message: "User tidak ditemukan",
            }, {
                status: 404,
                headers: corsHeaders,
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({
                message: "Invalid password",
            }, {
                status: 401,
                headers: corsHeaders,
            });
        }

        return NextResponse.json({
            message: "Login sukses",
            user,
        }, {
            status: 200,
            headers: corsHeaders,
        });
    } catch (error) {
        console.log("[LOGIN_POST]", error);
        return NextResponse.json({
            message: "Internal error",
        }, {
            status: 500,
            headers: corsHeaders,
        });
    }
}