import { FastifyInstance } from 'fastify';
import { ClubService } from '../services/club.service.js';
import { createClubSchema, updateClubSchema, getClubSchema } from '../schemas/club.schema.js';
import type { CreateClubDto, UpdateClubDto } from '../dto/club.dto.js';


export async function clubRoutes(fastify: FastifyInstance) {

    fastify.get('/clubs', async (request, reply) => {
    try {
      const service = new ClubService(request.server.prisma);
      const clubs = await service.getAll();
      
      request.log.info(`Found ${clubs.length} clubs`);
      
      return clubs;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to fetch clubs' };
    }
  });
  
  fastify.get('/clubs/:id', {schema: getClubSchema}, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const service = new ClubService(request.server.prisma);
      const club = await service.getById(parseInt(id));

      if (!club) {
        reply.code(404);
        return { error: 'Club not found' };
      }

      request.log.info(`Found club with ID ${id}`);
      return club;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to fetch club' };
    }
  });

  fastify.post('/clubs', { schema: createClubSchema }, async (request, reply) => {
    try {
      const service = new ClubService(request.server.prisma);
      const club = await service.create(request.body as CreateClubDto);
      request.log.info(`Created club with ID ${club.id}`);
      reply.code(201);
      return club;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to create club' };
    }
  });

  fastify.put('/clubs/:id', { schema: updateClubSchema }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const service = new ClubService(request.server.prisma);
      const updated = await service.update(parseInt(id), request.body as UpdateClubDto);
      request.log.info(`Updated club with ID ${id}`);
      return updated;
    } catch (error: any) {
      request.log.error(error);
      if (error.code === 'P2025') {
        reply.code(404);
        return { error: 'Club not found' };
      }
      reply.code(500);
      return { error: 'Failed to update club' };
    }
  });

  fastify.delete('/clubs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const service = new ClubService(request.server.prisma);
      await service.delete(parseInt(id));
      request.log.info(`Deleted club with ID ${id}`);
    } catch (error: any) {
      request.log.error(error);
      if (error.code === 'P2025') {
        reply.code(404);
        return { error: 'Club not found' };
      }
      reply.code(500);
      return { error: 'Failed to delete club' };
    }
  });
}