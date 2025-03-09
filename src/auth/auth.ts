import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const users: { id: number; username: string; password: string }[] = [];

export const registerUser = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: users.length + 1, username, password: hashedPassword };
      users.push(user);
  
      return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  

export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, "SECRET_KEY", { expiresIn: "1h" });
  res.json({ token });
};

export const getUsers = (req: Request, res: Response) => {
  res.json(users.map((user) => ({ id: user.id, username: user.username })));
};
