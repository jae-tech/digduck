import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { LicenseController } from '../controllers/license.controller'

async function licensePlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const licenseController = new LicenseController()
  
  // License routes prefix
  await fastify.register(async function (fastify) {
    await licenseController.routes(fastify)
  }, { prefix: '/api/license' })
}

export default fp(licensePlugin, {
  name: 'license-plugin'
})