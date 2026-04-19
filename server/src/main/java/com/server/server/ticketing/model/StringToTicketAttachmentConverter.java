package com.server.server.ticketing.model;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

@ReadingConverter
public class StringToTicketAttachmentConverter implements Converter<String, TicketAttachment> {

    @Override
    public TicketAttachment convert(String source) {
        String normalizedSource = source != null ? source.trim() : "";
        TicketAttachment attachment = new TicketAttachment();
        attachment.setId(UUID.nameUUIDFromBytes(normalizedSource.getBytes(StandardCharsets.UTF_8)).toString());
        attachment.setOriginalName(extractFileName(normalizedSource));
        attachment.setFileName(extractFileName(normalizedSource));
        attachment.setMimeType("application/octet-stream");
        attachment.setSize(0);
        attachment.setUrl(normalizedSource);
        attachment.setUploadedAt(null);
        attachment.setUploadedBy(null);
        return attachment;
    }

    private String extractFileName(String value) {
        if (value == null || value.isBlank()) {
            return "attachment";
        }

        String normalizedValue = value.replace('\\', '/');
        int lastSlashIndex = normalizedValue.lastIndexOf('/');
        String fileName = lastSlashIndex >= 0 ? normalizedValue.substring(lastSlashIndex + 1) : normalizedValue;
        return fileName.isBlank() ? "attachment" : fileName;
    }
}
