import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { prisma } from "../lib/prisma"
import dayjs from "dayjs"
import { getMailClient } from "../lib/mail"

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(4),
                //coerce tenta converter o valor que esta vindo do meu body para uma data
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),

            })
        }
    }, async (request) => {
        const { destination, starts_at, ends_at, owner_name, owner_email } = request.body

        if (dayjs(starts_at).isBefore(new Date())) {
            throw new Error('invalid trip start date')
        }

        if (dayjs(ends_at).isBefore(starts_at)) {
            throw new Error('invalid trip end date')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at
            }
        })

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe plann.er',
                address: 'plann.er@equipesuporte.com'
            },
            to: {
                name: owner_name,
                address: owner_email
            },
            subject: 'Testando envio de e-mail',
            html: `<p>Olá ${owner_name}<br>Espero que estejá tudo certo para sua viagem </p>`
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id }
    })
}
