"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PitchesController = void 0;
const common_1 = require("@nestjs/common");
const pitches_service_1 = require("./pitches.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PitchesController = class PitchesController {
    pitchesService;
    constructor(pitchesService) {
        this.pitchesService = pitchesService;
    }
    create(req, createPitchDto) {
        return this.pitchesService.create(req.user.userId, createPitchDto);
    }
    findAll(take, skip) {
        return this.pitchesService.findAll(take ? Math.min(Number(take), 100) : 50, skip ? Number(skip) : 0);
    }
    getFacilities() {
        return this.pitchesService.getFacilities();
    }
    findMine(req) {
        return this.pitchesService.findMine(req.user.userId);
    }
    update(req, id, updatePitchDto) {
        return this.pitchesService.update(req.user.userId, id, updatePitchDto);
    }
    remove(req, id) {
        return this.pitchesService.remove(req.user.userId, id);
    }
    getAvailability(id, date) {
        if (!date) {
            date = new Date().toISOString().split('T')[0];
        }
        return this.pitchesService.getAvailability(id, date);
    }
    getReviews(id) {
        return this.pitchesService.getReviews(id);
    }
    addReview(id, reviewDto) {
        return this.pitchesService.addReview(id, reviewDto);
    }
    getInsights(req) {
        return this.pitchesService.getInsights(req.user.userId);
    }
    findOne(id) {
        return this.pitchesService.findOne(id);
    }
    async verify(req, id) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ConflictException('Only admins can verify pitches.');
        }
        return this.pitchesService.verify(id);
    }
};
exports.PitchesController = PitchesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('take')),
    __param(1, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('facilities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "getFacilities", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "findMine", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Post)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "addReview", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('insights'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "getInsights", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PitchesController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/verify'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PitchesController.prototype, "verify", null);
exports.PitchesController = PitchesController = __decorate([
    (0, common_1.Controller)('pitches'),
    __metadata("design:paramtypes", [pitches_service_1.PitchesService])
], PitchesController);
//# sourceMappingURL=pitches.controller.js.map