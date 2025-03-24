const fs = require('fs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const chalk = require('chalk');
const readline = require('readline');

class BaileysBot {
  constructor() {
    this.null = null;
  }

  generateOTP(length = 6) {
    const digits = '0123456789';
    return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
  }

  saveToJSON(data, fileName) {
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    console.log(chalk.green(`Data saved to file: ${fileName}`));
  }

  loadFromJSON(fileName) {
    if (fs.existsSync(fileName)) {
      const data = fs.readFileSync(fileName);
      return JSON.parse(data);
    }
    return null;
  }

  async validateEmail(email) {
    try {
      const response = await axios.get("https://raw.githubusercontent.com/Nazir99inf/Ip/refs/heads/main/login.json");
      return response.data.some(entry => entry.email === email);
    } catch (error) {
      console.log(chalk.red('Failed to fetch data from API:', error.message));
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
     
   [ ! ] Note Jangan Kasih Kode Ini Ke Siapapun Dan Jangan Perjualbelikan Script Ini Tanpa Izin Nazir
   Selamat mencoba Source code Nya
    [==============================================]`
    };

    return transporter.sendMail(mailOptions);
  }

  async login(config) {
    const { fileName } = config;
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    // Cek status verifikasi
    const savedData = this.loadFromJSON(fileName);
    if (savedData && savedData.status === true) {
      console.log(chalk.green('User already verified! ✅'));
      console.log(`Welcome back, ${savedData.email}!`);
      rl.close();
      return true;
    }

    // Proses login normal jika belum terverifikasi
    return new Promise((resolve) => {
      rl.question(chalk.yellow('Enter your email: '), async (emailInput) => {
        try {
          const isValid = await this.validateEmail(emailInput);
          if (!isValid) {
            console.log(chalk.red('Email is not in the authorized list.'));
            resolve(false);
            rl.close();
            return;
          }

          const otp = this.generateOTP();
          console.log(chalk.green(`Valid email found: ${emailInput}`));
          this.saveToJSON({ email: emailInput, otp, status: false }, fileName);
          await this.sendOTP(emailInput, otp, "nazirotpverify@gmail.com", "ygtiqllspquqbvaj");

          rl.question(chalk.yellow('Enter the OTP received in your email: '), (otpInput) => {
            if (otpInput === otp) {
              console.log(chalk.green('Verification successful! ✅'));
              this.saveToJSON({ email: emailInput, otp, status: true }, fileName); // Update status menjadi verified
              resolve(true);
            } else {
              console.log(chalk.red('Invalid OTP. ❌'));
              resolve(false);
            }
            rl.close();
          });
        } catch (error) {
          console.log(chalk.red('Error:', error.message));
          resolve(false);
          rl.close();
        }
      });
    });
  }
}

module.exports = BaileysBot;
