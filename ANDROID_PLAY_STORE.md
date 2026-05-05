# Publicacao Android na Google Play

Este projeto ja possui app Android via Capacitor com o identificador:

- package/applicationId: `com.simplesmanutencao.app`

O que falta para publicar e gerar o `.aab` final:

## 1. Instalar Java e configurar JAVA_HOME

Use JDK 21 ou a versao instalada junto com o Android Studio.

No PowerShell, confirme assim:

```powershell
java -version
$env:JAVA_HOME
```

Se nao estiver configurado, ajuste no Windows:

- `JAVA_HOME` -> pasta do JDK
- `Path` -> incluir `%JAVA_HOME%\bin`

Exemplo comum:

```powershell
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Android\Android Studio\jbr', 'User')
```

Feche e abra o VS Code depois.

## 2. Criar sua chave de upload

Na raiz do projeto, rode:

```powershell
keytool -genkeypair -v -keystore android\upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Guarde a senha e o alias. Sem isso, voce nao consegue atualizar o app no futuro.

## 3. Criar o arquivo local de assinatura

Copie `android\keystore.properties.example` para `android\keystore.properties` e preencha com seus dados reais:

```properties
storeFile=../upload-keystore.jks
storePassword=SUA_SENHA
keyAlias=upload
keyPassword=SUA_SENHA
```

Esse arquivo esta ignorado no Git.

## 4. Atualizar a versao antes de cada envio

Edite `android/app/build.gradle`:

- `versionCode`: precisa subir a cada nova versao na Play Store
- `versionName`: nome visivel da versao, ex. `1.0.1`

Hoje o projeto esta em:

- `versionCode 2`
- `versionName "1.0.1"`

## 5. Gerar o Android App Bundle

Execute:

```powershell
npm run bundle:android
```

Saida esperada:

```text
android\app\build\outputs\bundle\release\app-release.aab
```

## 6. Subir na Play Console

No Google Play Console:

1. Criar aplicativo
2. Escolher idioma padrao e nome do app
3. Ir em `Testes` -> `Teste interno` para o primeiro envio
4. Enviar o arquivo `.aab`
5. Preencher a ficha da loja
6. Preencher `Politica de privacidade`
7. Preencher `Seguranca dos dados`
8. Preencher `Classificacao de conteudo`
9. Informar se ha anuncios
10. Enviar para revisao

## 7. Materiais que a Google Play normalmente exige

- icone do app 512x512
- feature graphic 1024x500
- capturas de tela do celular
- descricao curta
- descricao completa
- e-mail de suporte
- URL de politica de privacidade

## 8. Estrategia recomendada

Nao publique direto em producao no primeiro envio.

Use esta sequencia:

1. Teste interno
2. Teste fechado
3. Producao

## 9. Estado atual deste projeto

- build web: OK
- sync Capacitor Android: OK
- estrutura Android: OK
- bundle release: OK
- arquivo gerado: `android/app/build/outputs/bundle/release/app-release.aab`
- assinatura release: preparada para usar `android/keystore.properties`

## 10. Comandos uteis

```powershell
npm run build:android
npm run bundle:android
.\android\gradlew.bat bundleRelease
```