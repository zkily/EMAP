import userMaster from "./users.js"; //  ユーザー
import departmentsRoutes from "./departments.js"; // 部門
import customerMaster from "./customers.js"; // 顧客
import destinationRoutes from "./destinations.js"; // 納入先
import carriers from "./carriers.js"; // 運送便
import productRoutes from "./products.js"; // 製品
import materialRoutes from "./materials.js"; // 材料
import destinationHolidayAPI from "./destinationHoliday.js"; // 祝日と祝日出勤
import processRoutes from "./processes.js"; // 工程
import processRouterRoutes from "./processesRouter.js"; // 工程工序
import productProcessRoutes from "./productProcessRouter.js"; // 製品工程工序
import componentRoutes from "./components.js"; // 部品
import suppliersRouter from "./suppliers.js"; // 仕入先
import componentMaterialsRouter from "./componentMaterials.js"; //部品材料
import machineRouter from "./machines.js"; //设备
import optionRoutes from "./options.js"; // CD + 名
import bomRouter from "./bom.js"; // BOM 物料清单

export default [
  { path: "/users", router: userMaster },
  { path: "/departments", router: departmentsRoutes },
  { path: "/customer", router: customerMaster },
  { path: "/destinations", router: destinationRoutes },
  { path: "/carriers", router: carriers },
  { path: "/products", router: productRoutes },
  { path: "/materials", router: materialRoutes },
  { path: "/holiday", router: destinationHolidayAPI },
  { path: "/processes", router: processRoutes },
  { path: "/processes/routes", router: processRouterRoutes },
  { path: "/product/process/routes", router: productProcessRoutes },
  { path: "/components", router: componentRoutes },
  { path: "/suppliers", router: suppliersRouter },
  { path: "/component-materials", router: componentMaterialsRouter },
  { path: "/options", router: optionRoutes },
  { path: "/machines", router: machineRouter },
  { path: "/bom", router: bomRouter },
];
