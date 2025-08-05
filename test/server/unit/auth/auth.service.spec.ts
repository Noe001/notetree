import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@app/auth/auth.service';
import { UserService } from '@app/user/user.service';
import { User } from '@app/user/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockUsers: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  } as User
];

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser()', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = mockUsers[0];

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser(email, password);
      expect(result).toEqual(user);
      expect(userService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser(email, password);
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const user = mockUsers[0];

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser(email, password);
      expect(result).toBeNull();
    });
  });

  describe('login()', () => {
    it('should return access token for valid user', async () => {
      const user = mockUsers[0];
      const token = 'mock-jwt-token';

      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(user);
      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        name: user.name
      });
    });
  });

  describe('register()', () => {
    it('should create new user and return access token', async () => {
      const registerData = {
        email: 'newuser@example.com',
        name: 'New User',
        username: 'newuser',
        password: 'password123'
      };
      const newUser = {
        ...mockUsers[0],
        ...registerData,
        id: '2',
        email: registerData.email,
        name: registerData.name,
        username: registerData.username
      };
      const token = 'new-user-jwt-token';

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userService, 'create').mockResolvedValue(newUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.register(registerData);
      expect(result).toEqual({ access_token: token });
      expect(userService.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(userService.create).toHaveBeenCalledWith({
        email: registerData.email,
        name: registerData.name,
        username: registerData.username
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: newUser.id,
        email: newUser.email,
        name: newUser.name
      });
    });

    it('should throw error when email already exists', async () => {
      const registerData = {
        email: 'test@example.com',
        name: 'New User',
        username: 'newuser',
        password: 'password123'
      };
      const existingUser = mockUsers[0];

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(existingUser);

      await expect(service.register(registerData)).rejects.toThrow(
        new HttpException('User already exists', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when email is invalid', async () => {
      const registerData = {
        email: 'invalid-email',
        name: 'New User',
        username: 'newuser',
        password: 'password123'
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      await expect(service.register(registerData)).rejects.toThrow(
        new HttpException('Invalid email format', HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('getProfile()', () => {
    it('should return user profile', async () => {
      const userId = '1';
      const user = mockUsers[0];

      jest.spyOn(userService, 'findOne').mockResolvedValue(user);

      const result = await service.getProfile(userId);
      expect(result).toEqual(user);
      expect(userService.findOne).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      const userId = '999';

      jest.spyOn(userService, 'findOne').mockImplementation(async () => {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      });

      await expect(service.getProfile(userId)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('updateProfile()', () => {
    it('should update user profile', async () => {
      const userId = '1';
      const updateData = { name: 'Updated Name' };
      const existingUser = mockUsers[0];
      const updatedUser = { ...existingUser, ...updateData };

      jest.spyOn(userService, 'findOne').mockResolvedValue(existingUser);
      jest.spyOn(userService, 'update').mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateData);
      expect(result).toEqual(updatedUser);
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(userService.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should throw error when user not found', async () => {
      const userId = '999';
      const updateData = { name: 'Updated Name' };

      jest.spyOn(userService, 'findOne').mockImplementation(async () => {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      });

      await expect(service.updateProfile(userId, updateData)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND)
      );
    });
  });
});
