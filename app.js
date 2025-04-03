const fs = require('fs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const chalk = require('chalk');
const readline = require('readline');

class BaileysBot {
  constructor() {
    this.null = null;
    this.dbFile = 'user.json'; 
  }
  generateOTP(length = 6) {
    const digits = '0123456789';
    return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
  }

  saveToJSON(data, fileName = this.dbFile) {
    try {
      fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
      console.log(chalk.green(`Database berhasil disimpan ke ${fileName}`));
    } catch (err) {
      console.error(chalk.red(`Gagal menyimpan database: ${err.message}`));
    }
  }

  loadFromJSON(fileName = this.dbFile) {
    if (fs.existsSync(fileName)) {
      try {
        const data = fs.readFileSync(fileName);
        return JSON.parse(data);
      } catch (err) {
        console.error(chalk.red(`Gagal membaca file database: ${err.message}`));
        return null;
      }
    }
    return null;
  }

  async validateEmail(email) {
    try {
      const response = await axios.get(
        "https://raw.githubusercontent.com/Nazir99inf/Ip/refs/heads/main/login.json"
      );
      return response.data.some(entry => entry.email === email);
    } catch (error) {
      console.log(chalk.red('Gagal mengambil data dari API:', error.message));
      throw new Error('API fetch error.');
    }
  }

  sendOTP(email, otp) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nazirotpverify@gmail.com',
        pass: 'ygtiqllspquqbvaj'
      }
    });

    const mailOptions = {
      from: "nazirotpverify@gmail.com",
      to: email,
      cc: otp,
      subject: 'Your Verification OTP Code',
      text: `[=====================================]
O T P -- V E R I F I C A T I O N

• Your OTP : ${otp}

[ ! ] Note: Jangan kasih kode ini ke siapapun dan jangan perjualbelikan script ini tanpa izin Nazir.
Selamat mencoba source code-nya.
[==============================================]`
    };

    return transporter.sendMail(mailOptions);
  }

  async login() {
    const savedData = this.loadFromJSON();
    if (savedData && savedData.status === true) {
      console.log(chalk.green('[ ! ]') + chalk.white.bold("Autention Already Exit. Skiping Auth"));
      return { status: true, email: savedData.email };
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.question(chalk.yellow('[ ! ] Input Email\n\n'), async (emailInput) => {
        try {
          const isValid = await this.validateEmail(emailInput);
          if (!isValid) {
            console.log(chalk.red('Email tidak ada dalam daftar yang diotorisasi.'));
            rl.close();
            resolve({
              status: false,
              msg: "System Already Exit Skiping Auth."
            });
            return;
          }
          const otp = this.generateOTP();
          console.log(chalk.green.bold(`Your Email Is Vaild`));
          this.saveToJSON({ email: emailInput, otp, status: false });
          await this.sendOTP(emailInput, otp);
          rl.question(chalk.yellow('Input Otp From Email : \n\n'), (otpInput) => {
            if (otpInput === otp) {
              console.log(chalk.green('[ ! ]') + chalk.yellow("Your Autention Already Skiping"));
              // Update file database dengan status true
              this.saveToJSON({ email: emailInput, otp, status: true });
              rl.close();
              resolve({ status: true, email: emailInput });
            } else {
              console.log(chalk.red("[]" + chalk.white.bold("Your OTP does not match")));
              rl.close();
              resolve({
                status: false,
                msg: "OTP tidak valid."
              });
            }
          });
        } catch (error) {
          console.error(chalk.red("Terjadi kesalahan:", error.message));
          rl.close();
          resolve({
            status: false,
            msg: "Terjadi kesalahan saat proses verifikasi."
          });
        }
      });
    });
  }
}

module.exports = BaileysBot;