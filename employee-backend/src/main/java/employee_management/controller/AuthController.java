
package employee_management.controller;

import employee_management.model.User;
import employee_management.repository.UserRepository;
import employee_management.service.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // SIGNUP: Public registration creates Employee accounts only
    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @RequestBody SignupRequest request) {

        System.out.println("SIGNUP REQUEST RECEIVED");

        if (request.email == null
                || request.email.isBlank()
                || request.password == null
                || request.password.isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Email and password are required"));
        }

        String email = request.email.trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message",
                            "Email is already registered"));
        }

        User user = new User(
                email,
                passwordEncoder.encode(request.password),
                "EMPLOYEE"
        );

        userRepository.save(user);

        System.out.println("SIGNUP SUCCESSFUL: " + email);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Signup successful",
                        "email", email,
                        "role", "EMPLOYEE"
                ));
    }

    // LOGIN: HR, Manager, and Employee
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        System.out.println("LOGIN CONTROLLER REACHED");

        if (request.email == null
                || request.email.isBlank()
                || request.password == null
                || request.password.isBlank()) {

            System.out.println("LOGIN FAILED: Email or password missing");

            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Email and password are required"));
        }

        String email = request.email.trim().toLowerCase();

        System.out.println("LOGIN EMAIL: " + email);

        try {

            // Authenticate email and password
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    request.password
                            )
                    );

            System.out.println("AUTHENTICATION SUCCESSFUL");

            // Find user from database
            User user = userRepository.findByEmail(
                    authentication.getName()
            ).orElseThrow();

            // Validate role
            String role = user.getRole()
                    .trim()
                    .toUpperCase();

            if (!role.equals("HR")
                    && !role.equals("MANAGER")
                    && !role.equals("EMPLOYEE")) {

                System.out.println("LOGIN FAILED: Invalid role");

                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "message",
                                "Invalid user role"
                        ));
            }

            // Generate JWT token
            String token = jwtService.generateToken(
                    authentication.getName()
            );

            System.out.println("LOGIN SUCCESSFUL: " + email);

            return ResponseEntity.ok(
                    Map.of(
                            "token", token,
                            "tokenType", "Bearer",
                            "email", user.getEmail(),
                            "role", role,
                            "message", "Login successful"
                    )
            );

        } catch (AuthenticationException ex) {

            System.out.println(
                    "LOGIN AUTHENTICATION FAILED: "
                            + ex.getClass().getSimpleName()
            );

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid email or password"
                    ));
        }
    }

    // Signup request DTO
    public static class SignupRequest {
        public String email;
        public String password;
    }

    // Login request DTO
    public static class LoginRequest {
        public String email;
        public String password;
    }
}
