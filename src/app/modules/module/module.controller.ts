// Your controller code here
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { moduleFilterableFields } from './module.constant';
import { IModule } from './module.interface';
import { ModuleService } from './module.service';

const createModule = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const result = await ModuleService.createModule(req.body);

  sendResponse<IModule>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Module created successfully',
    data: result,
  });
});

//get all module

const getAllModules = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const filters = pick(req.query, moduleFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await ModuleService.getAllModules(
    filters,
    paginationOptions,
    id,
  );

  sendResponse<IModule[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Modules fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

//update module

const updateModule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ModuleService.updateModule(id, req.body);
  sendResponse<IModule>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Module updated successfully',
    data: result,
  });
});

//delete module

const deleteModule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ModuleService.deleteModule(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Module deleted successfully',
  });
});

export const ModuleController = {
  createModule,
  getAllModules,
  updateModule,
  deleteModule,
};
