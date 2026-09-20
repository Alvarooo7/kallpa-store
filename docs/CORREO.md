# Correo transaccional — Resend + Namecheap

Seis correos, ninguno decorativo. Implementados en `src/lib/mail/`.

| # | Cuándo | A quién | Plantilla |
| --- | --- | --- | --- |
| 1 | Pedido creado | Cliente | `orderConfirmation` |
| 2 | Pedido creado | **Tú** | `orderInternal` |
| 3 | Cupón solicitado | Suscriptor | `couponWelcome` |
| 4 | Reclamo registrado | Consumidor | `claimCopy` |
| 5 | Reclamo registrado | Empresa | `claimCopy({forCompany:true})` |
| 6 | Reclamo respondido | Consumidor | *pendiente, va con el panel* |

No hace falta instalar el SDK: se llama a la API de Resend con `fetch`.
Una dependencia menos que mantener.

---

## Paso 1 — Resend

1. Crea la cuenta en [resend.com](https://resend.com) y entra a **Domains → Add Domain**.
2. Escribe **`send.TUDOMINIO.com`**, no el dominio raíz.

   Usar un subdominio es la práctica recomendada y protege el dominio principal:
   si algún día un envío masivo daña la reputación, el daño queda en `send.` y no
   arrastra tu correo normal. Además evita chocar con los MX de tu buzón.

3. Resend te muestra tres registros. Déjalos abiertos.

## Paso 2 — Namecheap

**Domain List → Manage → Advanced DNS → Add New Record.**

El detalle que hace fallar a casi todos: **Namecheap agrega tu dominio solo**.
En el campo *Host* va únicamente la parte de la izquierda. Si Resend dice
`send.tudominio.com`, en Host escribes **`send`**, no el nombre completo.

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| MX Record | `send` | el valor que da Resend (`feedback-smtp...amazonses.com`) · Priority **10** | Automatic |
| TXT Record | `send` | `v=spf1 include:amazonses.com ~all` | Automatic |
| TXT Record | `resend._domainkey` | la clave DKIM larga que da Resend | Automatic |

Dos avisos de Namecheap:

- La columna de **Priority** del MX no tiene etiqueta: es la casilla sin nombre
  que aparece después de *Value*. Pon `10`.
- Si ya tenías MX apuntando a Gmail o a otro buzón, **no los borres**. Estos van
  en el host `send`, que es otro nivel, y no se pisan.

Después, en Resend, **Verify DNS Records**. Suele tardar minutos; la propagación
puede llegar a 72 horas, pero rara vez.

## Paso 3 — DMARC

No lo pide Resend, pero sin él Gmail te trata con desconfianza. Un registro más:

| Type | Host | Value |
| --- | --- | --- |
| TXT Record | `_dmarc` | `v=DMARC1; p=none; rua=mailto:kallpa.contacto.peru@gmail.com` |

`p=none` solo observa y te manda reportes. Cuando lleves unas semanas viendo que
todo tu correo legítimo pasa, súbelo a `p=quarantine`.

## Paso 4 — variables

En `.env.local` y en Vercel (Settings → Environment Variables):

```
RESEND_API_KEY=re_...
MAIL_FROM="Kallpita <pedidos@notifications.kallpita.store>"
MAIL_REPLY_TO=kallpa.contacto.peru@gmail.com
MAIL_INTERNAL=kallpa.contacto.peru@gmail.com
```

`MAIL_REPLY_TO` es el truco para no cambiar de rutina: el correo sale firmado
por tu dominio, pero cuando el cliente responde llega a tu Gmail de siempre.

---

## Cómo está construido

**El correo sale con `after()`, no antes de responder.** En Vercel una promesa
suelta se corta en cuanto la función devuelve la respuesta; `after` la mantiene
viva. Así el cliente ve su número de pedido al instante y el correo viaja detrás.

**Un fallo de correo nunca tumba un pedido.** `sendMail` no lanza: registra el
intento en la tabla `emails` con `sent` o `failed` y el error, y sigue. Un
problema de SMTP no puede hacer que alguien pierda su compra.

**Todo envío queda registrado.** Si un cliente dice "no me llegó nada", lo
consultas:

```sql
select created_at, template, status, error
  from emails
 where ref = 'VD-2026-000123'
 order by created_at;
```

## Probar sin gastar

Sin `RESEND_API_KEY` el sistema no rompe: avisa por consola que no envió y lo
anota como `failed`. Para una prueba real, Resend permite enviar a tu propia
dirección apenas creas la cuenta, antes de verificar el dominio.
