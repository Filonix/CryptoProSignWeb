// Глобальные переменные
let cadespluginLoaded = false;
let selectedFiles = [];
let signedFiles = [];
let verifyFiles = [];
let detachedSignatures = [];

// Функция для отображения статуса
function showStatus(message, type = 'info') {
    const statusArea = document.getElementById('statusArea');
    if (!statusArea) return;

    statusArea.innerHTML = `
        <div class="status ${type}">
            ${message}
        </div>
    `;
}

// Функция для инициализации плагина
async function initCadesPlugin() {
    try {
        showStatus('Инициализация плагина КриптоПро...', 'loading');
        
        if (typeof cadesplugin === 'undefined') {
            throw new Error('CAdES plugin не загружен. Убедитесь, что плагин КриптоПро ЭЦП установлен.');
        }

        await cadesplugin;
        cadespluginLoaded = true;
        return true;
    } catch (err) {
        console.error('Ошибка инициализации CAdES plugin:', err);
        showStatus(`Ошибка: ${err.message}`, 'error');
        return false;
    }
}

// Функция для обновления списка файлов
function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }
    
    fileList.style.display = 'block';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => removeFile(index);
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(fileSize);
        fileItem.appendChild(removeBtn);
        
        fileList.appendChild(fileItem);
    });
}

// Функция для обновления списка файлов для проверки
function updateVerifyFileList() {
    const verifyFileList = document.getElementById('verifyFileList');
    verifyFileList.innerHTML = '';
    
    if (verifyFiles.length === 0) {
        verifyFileList.style.display = 'none';
        return;
    }
    
    verifyFileList.style.display = 'block';
    
    verifyFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => removeVerifyFile(index);
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(fileSize);
        fileItem.appendChild(removeBtn);
        
        verifyFileList.appendChild(fileItem);
    });
}

// Функция для обновления списка отсоединенных подписей
function updateDetachedSignatureList() {
    const signatureFileList = document.getElementById('detachedSignatureFileList');
    signatureFileList.innerHTML = '';
    
    if (detachedSignatures.length === 0) {
        signatureFileList.style.display = 'none';
        document.getElementById('detachedSignatureLabel').style.display = 'none';
        document.getElementById('detachedSignatureInput').style.display = 'none';
        return;
    }
    
    signatureFileList.style.display = 'block';
    document.getElementById('detachedSignatureLabel').style.display = 'block';
    document.getElementById('detachedSignatureInput').style.display = 'block';
    
    detachedSignatures.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => removeDetachedSignature(index);
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(fileSize);
        fileItem.appendChild(removeBtn);
        
        signatureFileList.appendChild(fileItem);
    });
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Удаление файла из списка
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

// Удаление файла из списка проверки
function removeVerifyFile(index) {
    verifyFiles.splice(index, 1);
    updateVerifyFileList();
}

// Удаление отсоединенной подписи из списка
function removeDetachedSignature(index) {
    detachedSignatures.splice(index, 1);
    updateDetachedSignatureList();
}

// Подписание файлов
async function signFiles() {
    if (!cadespluginLoaded) {
        showStatus('Плагин КриптоПро не загружен. Пожалуйста, установите его и перезагрузите страницу.', 'error');
        return;
    }

    const output = document.getElementById('signatureOutput');
    const downloadLinks = document.getElementById('downloadLinks');
    const certSelect = document.getElementById('certSelect');
    const signType = document.querySelector('input[name="signType"]:checked').value;
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const signButton = document.getElementById('signButton');
    const downloadAll = document.getElementById('downloadAll');

    if (selectedFiles.length === 0) {
        showStatus('Пожалуйста, выберите файлы для подписи.', 'error');
        return;
    }

    if (certSelect.selectedIndex < 1) {
        showStatus('Пожалуйста, выберите сертификат для подписи.', 'error');
        return;
    }

    showStatus('Идет процесс подписания файлов...', 'loading');
    output.textContent = '';
    downloadLinks.innerHTML = '';
    signedFiles = [];
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    signButton.disabled = true;

    try {
        const oSigner = await cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
        const oStore = await cadesplugin.CreateObjectAsync("CAPICOM.Store");

        await oStore.Open(
            cadesplugin.CAPICOM_CURRENT_USER_STORE,
            cadesplugin.CAPICOM_MY_STORE,
            cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
        );

        const certs = await oStore.Certificates;
        const cert = await certs.Item(parseInt(certSelect.value));

        await oSigner.propset_Certificate(cert);

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            progressBar.style.width = `${(i / selectedFiles.length) * 100}%`;
            progressBar.textContent = `${Math.round((i / selectedFiles.length) * 100)}%`;
            
            try {
                const arrayBuffer = await readFileAsArrayBuffer(file);
                if (arrayBuffer.byteLength === 0) {
                    throw new Error('Выбранный файл пуст');
                }

                const byteArray = new Uint8Array(arrayBuffer);
                const binaryStr = Array.from(byteArray).map(b => String.fromCharCode(b)).join('');
                const base64 = btoa(binaryStr);

                const oSignedData = await cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
                await oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
                await oSignedData.propset_Content(base64);

                let signature;
                if (signType === 'attached') {
                    signature = await oSignedData.SignCades(
                        oSigner,
                        cadesplugin.CADESCOM_CADES_BES
                    );
                } else {
                    try {
                        signature = await oSignedData.SignCades(
                            oSigner,
                            cadesplugin.CADESCOM_CADES_BES,
                            true
                        );
                    } catch (err1) {
                        console.log('Попытка 1 создания отсоединенной подписи не удалась, пробуем вариант 2');
                        try {
                            signature = await oSignedData.SignCades(
                                oSigner,
                                cadesplugin.CADESCOM_CADES_DETACHED
                            );
                        } catch (err2) {
                            console.log('Попытка 2 создания отсоединенной подписи не удалась, пробуем вариант 3');
                            signature = await oSignedData.SignCades(
                                oSigner,
                                cadesplugin.CADESCOM_CADES_BES,
                                true,
                                cadesplugin.CADESCOM_INCLUDE_WHOLE_CHAIN
                            );
                        }
                    }
                }

                // Сохраняем подписанные файлы для скачивания
                signedFiles.push({
                    originalFile: file,
                    signature: signature,
                    signType: signType
                });

                // Добавляем ссылку для скачивания
                const linkContainer = document.createElement('div');
                linkContainer.style.marginBottom = '10px';
                
                const sigBlob = new Blob([signature], { type: 'application/octet-stream' });
                const sigLink = document.createElement('a');
                sigLink.className = 'save-link';
                sigLink.href = URL.createObjectURL(sigBlob);
                sigLink.download = file.name + ".sig";
                sigLink.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 8px;">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                    </svg>
                    Скачать подпись для ${file.name}
                `;
                
                linkContainer.appendChild(sigLink);
                
                if (signType === 'detached') {
                    const fileLink = document.createElement('a');
                    fileLink.className = 'save-link';
                    fileLink.style.marginLeft = '10px';
                    fileLink.href = URL.createObjectURL(file);
                    fileLink.download = file.name;
                    fileLink.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 8px;">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                        Скачать оригинал ${file.name}
                    `;
                    linkContainer.appendChild(fileLink);
                }
                
                downloadLinks.appendChild(linkContainer);
                
                output.textContent += `Файл ${file.name} успешно подписан!\n`;
            } catch (err) {
                console.error(`Ошибка при подписании файла ${file.name}:`, err);
                output.textContent += `Ошибка при подписании файла ${file.name}: ${err.message || 'неизвестная ошибка'}\n`;
            }
        }

        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        showStatus('Все файлы обработаны!', 'success');
        downloadAll.style.display = 'block';
    } catch (err) {
        console.error('Общая ошибка при подписании:', err);
        showStatus(`Ошибка: ${err.message || 'неизвестная ошибка'}`, 'error');
    } finally {
        signButton.disabled = false;
    }
}

// Проверка подписей
async function verifySignatures() {
    if (!cadespluginLoaded) {
        showStatus('Плагин КриптоПро не загружен. Пожалуйста, установите его и перезагрузите страницу.', 'error');
        return;
    }

    const verifyResults = document.getElementById('verifyResults');
    verifyResults.innerHTML = '';
    
    if (verifyFiles.length === 0) {
        showStatus('Пожалуйста, выберите файлы для проверки.', 'error');
        return;
    }

    showStatus('Идет процесс проверки подписей...', 'loading');
    
    try {
        const oSignedData = await cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
        
        for (const file of verifyFiles) {
            try {
                const arrayBuffer = await readFileAsArrayBuffer(file);
                const content = new Uint8Array(arrayBuffer);
                const signature = Array.from(content).map(b => String.fromCharCode(b)).join('');
                
                // Проверяем, есть ли соответствующая отсоединенная подпись
                let detachedSignature = null;
                if (detachedSignatures.length > 0) {
                    const sigFile = detachedSignatures.find(s => 
                        s.name === file.name + '.sig' || 
                        file.name === s.name.replace('.sig', '')
                    );
                    
                    if (sigFile) {
                        const sigArrayBuffer = await readFileAsArrayBuffer(sigFile);
                        detachedSignature = new Uint8Array(sigArrayBuffer);
                        detachedSignature = Array.from(detachedSignature).map(b => String.fromCharCode(b)).join('');
                    }
                }
                
                if (detachedSignature) {
                    // Проверка отсоединенной подписи
                    await oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
                    
                    const fileContent = Array.from(content).map(b => String.fromCharCode(b)).join('');
                    const base64Content = btoa(fileContent);
                    await oSignedData.propset_Content(base64Content);
                    
                    const verifyResult = await oSignedData.VerifyCades(detachedSignature, cadesplugin.CADESCOM_CADES_BES, true);
                    
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'status success';
                    resultDiv.innerHTML = `
                        <p><strong>${file.name}</strong>: Подпись действительна</p>
                        <p>${verifyResult}</p>
                    `;
                    verifyResults.appendChild(resultDiv);
                } else {
                    // Проверка присоединенной подписи
                    const verifyResult = await oSignedData.VerifyCades(signature, cadesplugin.CADESCOM_CADES_BES);
                    
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'status success';
                    resultDiv.innerHTML = `
                        <p><strong>${file.name}</strong>: Подпись действительна</p>
                        <p>${verifyResult}</p>
                    `;
                    verifyResults.appendChild(resultDiv);
                }
            } catch (err) {
                console.error(`Ошибка при проверке файла ${file.name}:`, err);
                
                const resultDiv = document.createElement('div');
                resultDiv.className = 'status error';
                resultDiv.innerHTML = `
                    <p><strong>${file.name}</strong>: Ошибка проверки подписи</p>
                    <p>${err.message || 'Неизвестная ошибка'}</p>
                `;
                verifyResults.appendChild(resultDiv);
            }
        }
        
        showStatus('Проверка подписей завершена', 'success');
    } catch (err) {
        console.error('Общая ошибка при проверке подписей:', err);
        showStatus(`Ошибка: ${err.message || 'неизвестная ошибка'}`, 'error');
    }
}

// Чтение файла как ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Скачивание всех подписанных файлов
function downloadAllSignedFiles() {
    if (signedFiles.length === 0) return;
    
    // Проверяем, доступна ли библиотека JSZip
    if (typeof JSZip === 'undefined') {
        showStatus('Для скачивания всех файлов требуется библиотека JSZip. Пожалуйста, добавьте её на страницу.', 'error');
        return;
    }
    
    const zip = new JSZip();
    const folder = zip.folder("signed_files");
    
    signedFiles.forEach(file => {
        folder.file(file.originalFile.name + ".sig", file.signature);
        if (file.signType === 'detached') {
            folder.file(file.originalFile.name, file.originalFile);
        }
    });
    
    zip.generateAsync({type: "blob"}).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "signed_files.zip";
        link.click();
    });
}

// Загрузка сертификатов
async function loadCertificates() {
    const certSelect = document.getElementById('certSelect');
    
    try {
        showStatus('Загрузка сертификатов...', 'loading');

        if (!cadespluginLoaded) {
            certSelect.innerHTML = '<option disabled>Плагин КриптоПро не загружен</option>';
            showStatus('Плагин КриптоПро не загружен', 'error');
            return;
        }

        const oStore = await cadesplugin.CreateObjectAsync("CAPICOM.Store");
        await oStore.Open(
            cadesplugin.CAPICOM_CURRENT_USER_STORE,
            cadesplugin.CAPICOM_MY_STORE,
            cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
        );

        const certs = await oStore.Certificates;
        const certCount = await certs.Count;

        certSelect.innerHTML = '<option disabled selected>Выберите сертификат</option>';

        if (certCount === 0) {
            certSelect.add(new Option("Нет доступных сертификатов", "", true, true));
            showStatus('Не найдено ни одного сертификата', 'error');
            return;
        }

        let hasValidCerts = false;
        for (let i = 1; i <= certCount; i++) {
            try {
                const cert = await certs.Item(i);
                const hasPrivateKey = await cert.HasPrivateKey;
                if (!hasPrivateKey) continue;

                const subject = await cert.SubjectName;
                const issuer = await cert.IssuerName;
                const validTo = await cert.ValidToDate;

                certSelect.add(new Option(
                    `${subject} | Выдан: ${issuer} | До: ${validTo}`,
                    i
                ));
                hasValidCerts = true;
            } catch (err) {
                console.error(`Ошибка обработки сертификата ${i}:`, err);
            }
        }

        if (!hasValidCerts) {
            certSelect.add(new Option("Нет доступных сертификатов с приватными ключами", "", true, true));
            showStatus('Нет сертификатов с приватными ключами', 'error');
        } else {
            certSelect.disabled = false;
            document.getElementById('fileInput').disabled = false;
            document.getElementById('signButton').disabled = false;
            showStatus('Сертификаты успешно загружены', 'success');
        }

    } catch (err) {
        console.error('Ошибка загрузки сертификатов:', err);
        certSelect.innerHTML = '<option disabled selected>Ошибка загрузки сертификатов</option>';
        showStatus(`Ошибка загрузки сертификатов: ${err.message || err}`, 'error');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация вкладок
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });

    // Обработка выбора файлов для подписи
    document.getElementById('fileInput').addEventListener('change', function(e) {
        selectedFiles = Array.from(e.target.files);
        updateFileList();
    });

    // Обработка выбора файлов для проверки
    document.getElementById('verifyFileInput').addEventListener('change', function(e) {
        verifyFiles = Array.from(e.target.files);
        updateVerifyFileList();
        
        // Показываем поле для отсоединенных подписей, если выбраны файлы
        if (verifyFiles.length > 0) {
            document.getElementById('detachedSignatureLabel').style.display = 'block';
            document.getElementById('detachedSignatureInput').style.display = 'block';
        } else {
            document.getElementById('detachedSignatureLabel').style.display = 'none';
            document.getElementById('detachedSignatureInput').style.display = 'none';
        }
    });

    // Обработка выбора отсоединенных подписей
    document.getElementById('detachedSignatureInput').addEventListener('change', function(e) {
        detachedSignatures = Array.from(e.target.files);
        updateDetachedSignatureList();
    });

    // Инициализация плагина
    const isPluginReady = await initCadesPlugin();
    if (isPluginReady) {
        await loadCertificates();
    } else {
        document.getElementById('certSelect').innerHTML = 
            '<option disabled selected>Требуется установка КриптоПро ЭЦП Browser plug-in</option>';
    }
});