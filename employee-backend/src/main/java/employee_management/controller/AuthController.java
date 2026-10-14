
package employee_management.controller;

import employee_management.model.User;
import employee_management.repository.UserRepository;
import employee_management.service.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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

        if (request.email == null
                || request.email.isBlank()
                || request.password == null
                || request.password.isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Email and password are required"));
        }

        String email = request.email.trim().toLowerCase();

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                email,
                                request.password
                        )
                );

        User user = userRepository.findByEmail(
                authentication.getName()
        ).orElseThrow();

        String role = user.getRole()
                .trim()
                .toUpperCase();

        if (!role.equals("HR")
                && !role.equals("MANAGER")
                && !role.equals("EMPLOYEE")) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "Invalid user role"));
        }

        String token = jwtService.generateToken(
                authentication.getName()
        );

        return ResponseEntity.ok(Map.of(
                "token", token,
                "tokenType", "Bearer",
                "email", user.getEmail(),
                "role", role,
                "message", "Login successful"
        ));
    }

    public static class SignupRequest {
        public String email;
        public String password;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }
}
