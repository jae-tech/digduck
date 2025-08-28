import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { CrawlHistoryController } from '../controllers/crawl-history.controller'

async function crawlHistoryPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const crawlHistoryController = new CrawlHistoryController()
  
  // Crawl History routes prefix
  await fastify.register(async function (fastify) {
    await crawlHistoryController.routes(fastify)
  }, { prefix: '/api/crawl' })
}

export default fp(crawlHistoryPlugin, {
  name: 'crawl-history-plugin'
})