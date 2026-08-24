const prisma = require('../prisma/client');
const { deleteOrderAdmin } = require('../controllers/order.controller');

async function testDeleteOrder() {
  console.log("🧪 Testing Admin Order Deletion...");

  // 1. Create a dummy order for deletion test
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }

  const dummyOrder = await prisma.order.create({
    data: {
      user_id: user.id,
      total: 1999,
      status: 'payment_pending',
      reservation_status: 'none'
    }
  });

  console.log(`Created dummy test order #${dummyOrder.id}`);

  // 2. Call deleteOrderAdmin
  let responseStatus = 200;
  let responseData = null;

  const mockReq = { params: { id: String(dummyOrder.id) } };
  const mockRes = {
    status: (s) => { responseStatus = s; return mockRes; },
    json: (d) => { responseData = d; return mockRes; }
  };

  await deleteOrderAdmin(mockReq, mockRes);

  console.log(`Delete Result (HTTP ${responseStatus}):`, responseData);

  // 3. Verify order is deleted from DB
  const check = await prisma.order.findUnique({ where: { id: dummyOrder.id } });
  console.log("Order exists after deletion:", Boolean(check));

  if (!check && responseStatus === 200) {
    console.log("✅ Order deletion works perfectly!");
  } else {
    console.error("❌ Order deletion failed");
  }

  await prisma.$disconnect();
}

testDeleteOrder();
