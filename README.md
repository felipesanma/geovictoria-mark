# GeoVictoria Mark (AWS Lambda + CDK)

Automatiza el marcado de entrada/salida en [GeoVictoria](https://clients.geovictoria.com) usando **AWS Lambda**, **puppeteer-core** y **@sparticuz/chromium**. Se despliega con **AWS CDK v2** y expone una **Function URL** pública.

---

## 🚀 Instalación rápida

### 1. Requisitos

* Node.js 20+
* AWS CLI configurado (`aws configure`)
* AWS CDK (`npm i -g aws-cdk`)

### 2. Instalar dependencias

```bash
npm install
cd lambda/geovictoriaMark
npm install --omit=dev
cd ../../
```

---

## 🏗️ Despliegue

Primera vez:

```bash
cdk bootstrap
```

Desplegar:

```bash
cdk synth
cdk deploy
```

Salida esperada:

```
Outputs:
GeoVictoriaMarkStack.GeoVictoriaFunctionUrl = https://abcdefgh.lambda-url.us-east-1.on.aws/
```

---

## 🌐 Uso (HTTP POST)

```bash
curl -X POST https://<fn-url>/ \
  -H "Content-Type: application/json" \
  -d '{"user":"correo@empresa.com","password":"clave"}'
```

**Respuestas:**

* `200` ✅ Ingreso/Egreso exitoso
* `400` ❌ Faltan credenciales
* `401` ⚠️ Credenciales inválidas
* `500` 💥 Error interno

---

## 🧹 Limpieza

Eliminar todos los recursos:

```bash
cdk destroy
```

---

## 📄 Licencia

MIT — uso libre y educativo.

