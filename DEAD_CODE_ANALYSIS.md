# Dead Code Analysis Report

## Summary
Analysis completed on 2025-11-04. Found several unused exports and files.

## Dead Code Found and Removed

### 1. ✅ Unused Mapper - REMOVED
- **File**: `src/api/mappers/user-order.mapper.ts` - **DELETED**
- **Issue**: `UserOrderMapper.toResponseDto()` is never called
- **Reason**: Routes manually serialize responses instead of using the mapper
- **Action**: ✅ Removed `UserOrderMapper` and `UserOrderResponseDto` from `user-order.dto.ts`

### 2. ✅ Unused DTOs - REMOVED
- **File**: `src/api/dto/user.dto.ts`
- **Issue**: `CreateUserRequestDto` and `CreateUserResponseDto` are never used
- **Reason**: Routes use Zod schemas directly instead of DTOs
- **Action**: ✅ Removed these unused DTOs

### 3. ✅ Placeholder Function - REMOVED
- **File**: `src/shared/utils/html-parser.utils.ts`
- **Issue**: `parseCartSummary()` is a placeholder that returns empty values, only used in tests
- **Reason**: Function was never fully implemented
- **Action**: ✅ Removed function and its tests

## Final Cleanup

### ✅ All Mappers Removed
- Removed `UserMapper` and replaced with direct serialization in `user.routes.ts`
- Removed `src/api/mappers/` directory (now empty)

### DTOs Still In Use
- ✅ `CreateUserOrderRequestDto` - Used in `create-user-order.service.ts` (type-only import)
- ✅ `UserResponseDto` - Removed (no longer needed without mappers)

## Summary

✅ **All mappers have been removed** - Routes now use direct serialization, which is:
- Simpler and more maintainable
- Consistent across all routes
- Easier to understand at a glance
- No unnecessary abstraction layer

## Remaining DTOs

Only request DTOs remain, which are still useful as type definitions:
- `CreateUserOrderRequestDto` - Used in service layer
- `CreateGroupOrderRequestDto` - Used in service layer

