const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const app = express();

// Parse data form dan JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
// Sajikan file statis dari folder public
app.use(express.static('public'));

const spreadsheetId = '16Z_g2OXbNZ4wgpo6r6O6pahzW2_uHA_3FRVFuhQYoMU'; // Ganti dengan ID spreadsheet kamu
const sheetName = 'Sheet2';

// Fungsi untuk mendapatkan client Google Sheets
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({ version: 'v4', auth });
}

// Endpoint untuk pendaftaran akun
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).send('Semua field harus diisi');
  }
  const sheets = await getSheetsClient();
  const request = {
    spreadsheetId,
    range: `${sheetName}!A:C`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[username, password, email]],
    },
  };

  try {
    await sheets.spreadsheets.values.append(request);
    res.send('Pendaftaran berhasil!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat mendaftar');
  }
});

// Endpoint untuk login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username dan password harus diisi');
  }
  const sheets = await getSheetsClient();
  try {
    // Ambil data dari spreadsheet
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:C`,
    });
    const rows = result.data.values;
    let valid = false;
    if (rows && rows.length > 0) {
      // Cek setiap baris: kolom A (username), B (password), dan pastikan email di kolom C valid (misal mengandung '@')
      for (const row of rows) {
        if (row[0] === username && row[1] === password && row[2] && row[2].includes('@')) {
          valid = true;
          break;
        }
      }
    }
    if (valid) {
      res.send('Login berhasil!');
    } else {
      res.status(401).send('Kredensial tidak valid');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat login');
  }
});

// Menjalankan server pada port 3000
app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});