import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Entity } from '../entities/entity.model';

@Injectable()
export class TemplateService {

  constructor(private http: HttpClient) { }
  httpURL: String = 'http://localhost:10010/ne';
  entites: Entity[];

  parseLabel(value) {
    if (!value) {
      return value;
    }
    var that: any = this;
    let labels = [];
    let parsedLabels = [];
    let isFwBraces = false;
    let fwIndex = 0, bwIndex = 0;
    fwIndex = value.indexOf('{{');
    while (fwIndex != -1 && bwIndex != -1) {
      if (isFwBraces) {
        fwIndex = value.indexOf('{{', fwIndex + 1); //Find forward braces index {{
        isFwBraces = false;
      } else {
        bwIndex = value.indexOf('}}', bwIndex + 1); //Find backward braces index }}
        isFwBraces = true;
        if (bwIndex != -1) {
          let label = value.substring(fwIndex + 2, bwIndex); //chunk the label using index
          labels.push(label);
        }
      }
    }
    // console.log(labels);
    return replaceHTML();

    function replaceHTML() {
      const fwEntityHTML = `<span class='badge badge-info'>`;
      const fwNoEntityHTML = `<span class='badge badge-danger'>`;
      const bwHTML = `</span>`;
      labels.forEach((data, i) => {
        data = (that.isEntity(data) ? fwEntityHTML : fwNoEntityHTML) + data + bwHTML;
        value = value.replace('{{' + labels[i] + '}}', data);
      });
      // console.log(value);
      return value;
    }
  }

  isEntity(value: string): boolean {
    let templateString: string[] = value.split('.');
    if (!this.entites) {
      return true;
    }
    let entity: Entity = this.entites.filter(d => d._id === templateString[0])[0] || null;
    if (!templateString[1]) {
      return true;
    } else if (templateString[1] && entity) {
      return entity.definition.filter(d => d === templateString[1]).length > 0;
    }
  }

  getEntities() {
    this.doRESTcall('GET', '', '/entity?select=_id,definition').subscribe(data => {
      this.entites = data;
      // console.log(data);
    },
      err => {
        console.log('HTTP Error' + err);
      });
  }


  doRESTcall(method, body, param): Observable<any> {
    return this.http.request(method, this.httpURL + param, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: body,
      params: param
    });
  }

}
