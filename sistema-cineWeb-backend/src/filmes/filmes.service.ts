import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilmeDto } from './dto/create-filme.dto';
import { UpdateFilmeDto } from './dto/update-filme.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { FilmeNovoEvent, TOPICO_FILMES_NOVOS } from '../kafka/kafka.constants';

@Injectable()
export class FilmesService {
    constructor(
        private prisma: PrismaService,
        private kafkaProducer: KafkaProducerService,
    ) { }

    async create(data: CreateFilmeDto) {
        const filme = await this.prisma.filme.create({
            data,
            include: { genero: true },
        });

        // Mensageria: publica o evento "filme novo" no Kafka.
        // O consumidor (NotificacoesConsumer) transforma o evento em notificação
        // para os clientes Web/Mobile. Falha no Kafka não impede o cadastro.
        const evento: FilmeNovoEvent = {
            filmeId: filme.id,
            titulo: filme.titulo,
            genero: filme.genero?.nome,
            classificacaoEtaria: filme.classificacaoEtaria,
            dataInicioExibicao: filme.dataInicioExibicao.toISOString(),
            criadoEm: new Date().toISOString(),
        };
        await this.kafkaProducer.publish(TOPICO_FILMES_NOVOS, filme.id, evento);

        return filme;
    }

    async findAll() {
        return this.prisma.filme.findMany({
            include: { genero: true }
        });
    }

    async findOne(id: string) {
        const filme = await this.prisma.filme.findUnique({ 
            where: { id },
            include: { genero: true }
        });
        if (!filme) throw new NotFoundException('Filme não encontrado');
        return filme;
    }

    async update(id: string, data: UpdateFilmeDto) {
        await this.findOne(id); // Garante que existe
        return this.prisma.filme.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.filme.delete({ where: { id } });
    }
}
