import { Test, TestingModule } from '@nestjs/testing';
import { PitchesController } from './pitches.controller';
import { PitchesService } from './pitches.service';

describe('PitchesController', () => {
  let controller: PitchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PitchesController],
      providers: [
        {
          provide: PitchesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            getAvailability: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PitchesController>(PitchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
