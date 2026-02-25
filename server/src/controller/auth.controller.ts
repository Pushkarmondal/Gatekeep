import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../db";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

export async function registerUserHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const {email, passwordHash} = request.body as {
            email: string;
            passwordHash: string;
        };
        if(!email || !passwordHash) {
            return reply.status(400).send({ error: "Email and password are required!" });
        }
        const hashedPassword = await bcrypt.hash(passwordHash, 10);
        const registerUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
            }
        })
        return reply.status(201).send({ 
            message: "User registered successfully!" , 
            id: registerUser.id, 
            email: registerUser.email
        });
    } catch (error) {
        reply.status(500).send({ error: "Internal server error while signup!"  });
    }
}

export async function loginUserHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const {email, passwordHash} = request.body as {
            email: string;
            passwordHash: string;
        };
        if(!email || !passwordHash) {
            return reply.status(400).send({ error: "Email and password are required!" });
        }
        const user = await prisma.user.findUnique({
            where: {
                email,
            }
        })
        if(!user) {
            return reply.status(404).send({ error: "User not found!"  });
        }
        const isPasswordValid = await bcrypt.compare(passwordHash, user.passwordHash!);
        if(!isPasswordValid) {
            return reply.status(401).send({ error: "Invalid password!"  });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET! || "your-jwt-secret", { expiresIn: "1h" });
        return reply.status(200).send({ 
            message: "User logged in successfully!", 
            id: user.id, 
            token
        });
    } catch (error) {
        reply.status(500).send({ error: "Internal server error while login!"  });
    }
}