import { Controller, Get, Post, Body, Param, Query, Patch, Delete, Req, UseGuards, ConflictException } from '@nestjs/common';
import { PitchesService } from './pitches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pitches')
export class PitchesController {
  constructor(private readonly pitchesService: PitchesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() createPitchDto: Record<string, unknown>) {
    return this.pitchesService.create(req.user.userId, createPitchDto);
  }

  @Get()
  findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.pitchesService.findAll(
      take ? Math.min(Number(take), 100) : 50,
      skip ? Number(skip) : 0,
    );
  }

  @Get('facilities')
  getFacilities() {
    return this.pitchesService.getFacilities();
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req: { user: { userId: string } }) {
    return this.pitchesService.findMine(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() updatePitchDto: Record<string, unknown>,
  ) {
    return this.pitchesService.update(req.user.userId, id, updatePitchDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.pitchesService.remove(req.user.userId, id);
  }

  @Get(':id/availability')
  getAvailability(@Param('id') id: string, @Query('date') date: string) {
    if (!date) {
        // Default to today if no date provided
        date = new Date().toISOString().split('T')[0];
    }
    return this.pitchesService.getAvailability(id, date);
  }

  @Get(':id/reviews')
  getReviews(@Param('id') id: string) {
    return this.pitchesService.getReviews(id);
  }

  @Post(':id/reviews')
  addReview(
    @Param('id') id: string,
    @Body() reviewDto: { name: string; rating: number; comment?: string },
  ) {
    return this.pitchesService.addReview(id, reviewDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('insights')
  getInsights(@Req() req: { user: { userId: string } }) {
    return this.pitchesService.getInsights(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pitchesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/verify')
  async verify(@Req() req: { user: { role: string } }, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new ConflictException('Only admins can verify pitches.');
    }
    return this.pitchesService.verify(id);
  }
}
