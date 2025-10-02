import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Ambil password yang dikirim dari frontend
    const { password } = await req.json();

    // 2. Ambil password rahasia dari environment variable di server
    const secretPassword = process.env.APP_PASSWORD;

    // 3. Bandingkan keduanya
    if (password === secretPassword) {
      // Jika cocok, kirim jawaban "sukses" (status 200)
      return NextResponse.json({ message: 'Login successful' }, { status: 200 });
    } else {
      // Jika tidak cocok, kirim jawaban "gagal" (status 401)
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    // Jika terjadi error lain di server
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

