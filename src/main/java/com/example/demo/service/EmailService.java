package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.AuthenticationRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;


@Service
public class EmailService {

    @Autowired
    TemplateEngine templateEngine;

    @Autowired
    JavaMailSender javaMailSender;

    @Autowired
    AuthenticationRepository authenticationRepository;

    public void sendResetOTPMail(String to, String subject, String otp, int expiredMinutes){
        try{
            User currentUser = authenticationRepository.findUserByEmail(to);
            if (currentUser == null) throw new RuntimeException("Email không tồn tại");

            Context context = new Context();
            context.setVariable("name", currentUser.getFullName());
            context.setVariable("otp", otp);
            context.setVariable("expired", expiredMinutes);
            context.setVariable("link", "https://www.youtube.com/");

            String html = templateEngine.process("emailOTPtemplate", context);

            // Creating a simple mail message
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage);

            // Setting up necessary details
            mimeMessageHelper.setFrom("Blood Donation Support System <admin@gmail.com>");
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setText(html, true);
            mimeMessageHelper.setSubject(subject);
            javaMailSender.send(mimeMessage);

        } catch (Exception e){
            System.out.println(e.getMessage());
        }
    }

    public void sendAcpResetPasswordMail(String to, String subject){

        try{
            User currentUser = authenticationRepository.findUserByEmail(to);
            if (currentUser == null) throw new RuntimeException("Email không tồn tại");

            Context context = new Context();
            context.setVariable("name", currentUser.getFullName());
            context.setVariable("link", "https://www.youtube.com/");

            String html = templateEngine.process("resetPasswordtemplate", context);

            // Creating a simple mail message
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage);

            // Setting up necessary details
            mimeMessageHelper.setFrom("Blood Donation Support System <admin@gmail.com>");
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setText(html, true);
            mimeMessageHelper.setSubject(subject);
            javaMailSender.send(mimeMessage);

        } catch (Exception e){
            System.out.println(e.getMessage());
        }
    }

    public void sendWelcomeMail(String to, String subject) {
        try {
            User currentUser = authenticationRepository.findUserByEmail(to);
            if (currentUser == null) throw new RuntimeException("Email không tồn tại");

            Context context = new Context();
            context.setVariable("name", currentUser.getFullName());
            context.setVariable("email", currentUser.getEmail());
//            context.setVariable("link", "http://172.20.10.11:8080/api/user/activate?email=" + currentUser.getEmail());
            context.setVariable("link", "http://14.225.205.143:8080/api/user/activate?email=" + currentUser.getEmail());



            String html = templateEngine.process("welcomeEmailtemplate", context);

            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage);

            mimeMessageHelper.setFrom("Blood Donation Support System <admin@gmail.com>");
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setText(html, true);
            mimeMessageHelper.setSubject(subject);
            javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    public void sendSimpleMessage(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        javaMailSender.send(message);
    }
}
