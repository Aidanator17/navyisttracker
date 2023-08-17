const PrismaClient = require('@prisma/client').PrismaClient
const prisma = new PrismaClient()

const prisma_functions = {
    publish: async function(eid,fyes,fno,fsu) {
        const data = await prisma.published_data.create({
            data: {
                employee_id: eid,
                yes: fyes,
                no: fno,
                su: fsu,
                date: undefined
            },
          })
    },
    suspend: async function(eid,fyes,fno,fsu) {
        const data = await prisma.suspended_data.create({
            data: {
                employee_id: eid,
                yes: fyes,
                no: fno,
                su: fsu,
                date: undefined
            },
          })
    },
    retrieve: async function(eid) {
        const data = await prisma.suspended_data.findMany({
            where: {
                employee_id: eid
            }
        })
        return data
    },
    delete_suspension: async function(id){
        const deleteSuspension = await prisma.suspended_data.delete({
            where: {
              suspended_data_id: id,
            },
          })
    }
}

module.exports = prisma_functions