import db from "@/lib/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

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
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({
                message: "Please provide name, email, and password",
            }, { 
                status: 400,
                headers: corsHeaders,
            });
        }
        //already email registered
        const user = await db.user.findUnique({
            where: {
                email,
            },
        });

        if (user) {
            return NextResponse.json({
                message: "User already exist",
            }, {
                status: 400,
                headers: corsHeaders,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            message: "User created successfully",
            user: newUser,
        }, {
            status: 201,
            headers: corsHeaders,
        });
    } catch (error) {
        console.log("[REGISTER_POST]", error);
        return NextResponse.json({
            message: "Internal error",
        }, {
            status: 500,
            headers: corsHeaders,
        });
    }
}