const fs = require('fs');
const path = require('path');

const dirs = [
  'src/app/(auth)/login',
  'src/app/(dashboard)/admin',
  'src/app/(dashboard)/seller',
  'src/app/api/auth/[...nextauth]',
  'src/app/api/products',
  'src/app/api/orders',
  'src/components/admin',
  'src/components/seller',
  'src/lib',
  'src/types'
];

const files = {
  'src/app/(auth)/login/page.tsx': 'export default function LoginPage() { return <div>Login Page</div> }',
  'src/app/(dashboard)/admin/page.tsx': 'export default function AdminPage() { return <div>Admin Page</div> }',
  'src/app/(dashboard)/seller/page.tsx': 'export default function SellerPage() { return <div>Seller Page</div> }',
  'src/app/api/auth/[...nextauth]/route.ts': 'export { GET, POST } from "@/lib/auth";',
  'src/app/api/products/route.ts': 'export async function GET() { return Response.json({ message: "Products API" }) }',
  'src/app/api/orders/route.ts': 'export async function GET() { return Response.json({ message: "Orders API" }) }',
  'src/lib/prisma.ts': 'import { PrismaClient } from "@prisma/client";\n\nconst globalForPrisma = globalThis as unknown as { prisma: PrismaClient };\n\nexport const prisma = globalForPrisma.prisma || new PrismaClient();\n\nif (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;',
  'src/lib/auth.ts': 'import NextAuth from "next-auth";\n\nconst handler = NextAuth({\n  providers: [],\n});\n\nexport { handler as GET, handler as POST };',
  'src/lib/units.ts': '// Units utility functions',
  'src/types/index.ts': '// Shared types'
};

dirs.forEach(dir => {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

Object.entries(files).forEach(([file, content]) => {
  fs.writeFileSync(path.join(__dirname, file), content);
});

console.log('Done creating structure.');
